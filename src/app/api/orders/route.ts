import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'
import { postPOSOrderJournal } from '@/lib/accounting'
import { parseItemCustomization } from '@/lib/item-customization'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    
    const statusParam = searchParams.get('status')
    const limitParam = searchParams.get('limit')
    const sinceParam = searchParams.get('since')

    const whereClause: Record<string, unknown> = { tenantId }

    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length > 0) {
        whereClause.orderStatus = { in: statuses }
      }
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam)
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = { gte: sinceDate }
      }
    }

    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam)), 500) : 100

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: limit,
      include: {
        customer: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      orderNumber,
      staffId,
      discount = 0,
      paymentMethod,
      tableNumber,
      customerName,
      customerEmail,
      customerId,
      deviceId,
      notes,
      items,
      redeemedPoints,
      promoCode
    } = body

    if (!orderNumber || !staffId || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 })
    }

    // Idempotency check: if orderNumber already exists, return existing order cleanly (prevents sync stall)
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        staff: { select: { id: true, name: true, role: true } },
        items: { include: { menuItem: true } }
      }
    })

    if (existingOrder) {
      return NextResponse.json(existingOrder)
    }

    const tenantInfo = await getTenantById(tenantId)
    const activeTaxRate = tenantInfo.taxRate ?? 15.0

    const order = await prisma.$transaction(async (tx) => {
      // 1. Fetch official menu item prices from DB for verified price calculation
      const itemIds = items.map((i: { menuItemId?: string }) => i.menuItemId).filter(Boolean) as string[]
      const dbMenuItems = await tx.menuItem.findMany({
        where: { id: { in: itemIds }, tenantId }
      })
      const menuItemMap = new Map(dbMenuItems.map(m => [m.id, m]))

      // Calculate server-verified subtotal
      let verifiedSubtotal = 0
      const validatedItems = items.map((item: { 
        menuItemId: string; 
        price?: number | string; 
        quantity?: number | string; 
        notes?: string | null; 
        isPromoGift?: boolean;
        selectedOptions?: any[]
      }) => {
        const isPromoGift = Boolean(item.isPromoGift || (item.notes && String(item.notes).includes('Free Promo Item')) || item.price === 0)
        const dbItem = menuItemMap.get(item.menuItemId)
        const basePrice = isPromoGift ? 0 : (dbItem ? dbItem.price : parseFloat(String(item.price)) || 0)
        const unitPrice = isPromoGift ? 0 : (parseFloat(String(item.price)) || basePrice)
        const quantity = parseInt(String(item.quantity)) || 1
        const lineSubtotal = isPromoGift ? 0 : Math.round((unitPrice * quantity) * 100) / 100
        verifiedSubtotal += lineSubtotal

        return {
          menuItemId: item.menuItemId,
          quantity,
          price: unitPrice,
          subtotal: lineSubtotal,
          notes: item.notes || (isPromoGift ? 'Free Promo Item' : null),
          selectedOptions: item.selectedOptions || []
        }
      })

      // Calculate Promo Code discount (database lookup with legacy fallback)
      let promoDiscount = 0
      let promoDescription = ''
      let matchedDbPromoId: string | null = null
      const normalizedPromo = promoCode ? String(promoCode).trim().toUpperCase() : null
      if (normalizedPromo) {
        const dbPromo = await tx.promoCode.findUnique({
          where: { tenantId_code: { tenantId, code: normalizedPromo } },
          include: { freeItem: true }
        })

        if (dbPromo && dbPromo.isActive) {
          const now = new Date()
          const isDateValid = (!dbPromo.startDate || now >= new Date(dbPromo.startDate)) &&
                              (!dbPromo.endDate || now <= new Date(dbPromo.endDate))
          const isUsageValid = dbPromo.usageLimit === null || dbPromo.usedCount < dbPromo.usageLimit
          const isMinOrderValid = !dbPromo.minOrderAmount || verifiedSubtotal >= dbPromo.minOrderAmount

          if (isDateValid && isUsageValid && isMinOrderValid) {
            matchedDbPromoId = dbPromo.id
            if (dbPromo.discountType === 'percentage' && dbPromo.discountPercent) {
              promoDiscount = Math.round((verifiedSubtotal * (dbPromo.discountPercent / 100)) * 100) / 100
              if (dbPromo.maxDiscount && promoDiscount > dbPromo.maxDiscount) {
                promoDiscount = dbPromo.maxDiscount
              }
              promoDescription = `${dbPromo.discountPercent}% off`
            } else if (dbPromo.discountType === 'fixed_amount' && dbPromo.discountAmount) {
              promoDiscount = Math.min(verifiedSubtotal, dbPromo.discountAmount)
              promoDescription = `$${dbPromo.discountAmount} off`
            } else if (dbPromo.discountType === 'free_item' && dbPromo.freeItem) {
              promoDescription = `Free Gift: ${dbPromo.freeItem.name}`
            }
          }
        } else {
          // Legacy fallback demo codes
          if (normalizedPromo === 'WELCOME10') {
            promoDiscount = Math.round((verifiedSubtotal * 0.10) * 100) / 100
          } else if (normalizedPromo === 'SUMMER20') {
            promoDiscount = Math.round((verifiedSubtotal * 0.20) * 100) / 100
          } else if (normalizedPromo === 'VIP15') {
            promoDiscount = Math.round((verifiedSubtotal * 0.15) * 100) / 100
          } else if (normalizedPromo === 'HAPPYHOUR') {
            promoDiscount = Math.round((verifiedSubtotal * 0.25) * 100) / 100
          } else if (normalizedPromo === 'COFFEE5') {
            promoDiscount = Math.min(5.00, verifiedSubtotal)
          }
        }
      }

      // Calculate Loyalty Points redemption discount ($1 off per 100 points)
      let pointsDiscount = 0
      let actualDeductedPoints = 0
      const reqPoints = parseInt(redeemedPoints) || 0

      if (customerId && reqPoints > 0) {
        const custRecord = await tx.customer.findUnique({
          where: { id: customerId }
        })
        if (custRecord && custRecord.loyaltyPoints > 0) {
          const eligiblePoints = Math.min(custRecord.loyaltyPoints, reqPoints)
          const potentialDiscount = Math.round((eligiblePoints / 100) * 1.00 * 100) / 100
          const remainingAfterPromo = Math.max(0, verifiedSubtotal - promoDiscount)
          pointsDiscount = Math.min(potentialDiscount, remainingAfterPromo)
          actualDeductedPoints = Math.round(pointsDiscount * 100)
        }
      }

      const manualDiscount = Math.max(0, parseFloat(discount) || 0)
      const totalDiscountAmount = Math.min(
        verifiedSubtotal,
        Math.round((manualDiscount + promoDiscount + pointsDiscount) * 100) / 100
      )
      const taxableAmount = Math.max(0, verifiedSubtotal - totalDiscountAmount)
      const verifiedTax = Math.round((taxableAmount * (activeTaxRate / 100)) * 100) / 100
      const verifiedTotal = Math.round((taxableAmount + verifiedTax) * 100) / 100

      // Notes summary for discounts
      const discountNotesParts: string[] = []
      if (normalizedPromo) {
        if (promoDiscount > 0) {
          discountNotesParts.push(`Promo: ${normalizedPromo} (-$${promoDiscount.toFixed(2)})`)
        } else if (promoDescription) {
          discountNotesParts.push(`Promo: ${normalizedPromo} (${promoDescription})`)
        }
      }
      if (actualDeductedPoints > 0) discountNotesParts.push(`Redeemed ${actualDeductedPoints} pts (-$${pointsDiscount.toFixed(2)})`)
      const combinedNotes = [notes, discountNotesParts.length ? `[${discountNotesParts.join(' | ')}]` : null].filter(Boolean).join(' ')

      // 2. Create the order with verified pricing
      const createdOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          staffId,
          subtotal: verifiedSubtotal,
          tax: verifiedTax,
          discount: totalDiscountAmount,
          totalAmount: verifiedTotal,
          paymentMethod: paymentMethod || 'cash',
          paymentStatus: 'completed',
          orderStatus: 'pending',
          tableNumber: tableNumber ? parseInt(tableNumber) : null,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerId: customerId || null,
          deviceId: deviceId || 'main-pos',
          notes: combinedNotes || null,
          items: {
            create: validatedItems.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              notes: item.notes
            }))
          }
        },
        include: {
          customer: true,
          staff: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          items: {
            include: {
              menuItem: true
            }
          }
        }
      })

      // 3. Update customer loyalty points (deduct redeemed points and award earned points)
      if (customerId) {
        const earnedPoints = Math.max(1, Math.floor(verifiedTotal))
        const netChange = earnedPoints - actualDeductedPoints
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: netChange }
          }
        })
      }

      // 4. Deduct direct inventory, base recipes, and modifier ingredients for each item
      for (const item of validatedItems) {
        const itemQuantity = item.quantity

        // 4a. Deduct direct finished good inventory if exists
        const directInventory = await tx.inventory.findUnique({
          where: { menuItemId: item.menuItemId }
        })

        if (directInventory) {
          await tx.inventory.update({
            where: { id: directInventory.id },
            data: {
              quantity: Math.max(0, directInventory.quantity - itemQuantity)
            }
          })
        }

        // 4b. Deduct base raw recipes if configured
        const recipes = await tx.recipe.findMany({
          where: { menuItemId: item.menuItemId },
          include: { ingredient: true }
        })

        // Determine size key from selectedOptions or notes
        const sizeOption = item.selectedOptions?.find((o: any) =>
          o.groupName?.toLowerCase() === 'size' || o.groupName?.toLowerCase() === 'portion'
        )
        const sizeText = (sizeOption?.optionName || item.notes || '').toLowerCase()
        let sizeKey = 'M'
        if (sizeText.includes('extra large') || sizeText.includes('xl')) {
          sizeKey = 'XL'
        } else if (sizeText.includes('large') || sizeText.includes('lg')) {
          sizeKey = 'L'
        } else if (sizeText.includes('small') || sizeText.includes('sm')) {
          sizeKey = 'S'
        }

        const deductedIngredientIds = new Set<string>()

        for (const recipe of recipes) {
          // If this recipe is an optional modifier (e.g. optional plant milks, extra syrups):
          // ONLY deduct it if the customer actually selected it!
          if (recipe.isOptional) {
            const ingNameLower = recipe.ingredient.name.toLowerCase()
            const isSelected = item.selectedOptions?.some((opt: any) =>
              opt.ingredientId === recipe.ingredientId ||
              (opt.ingredientName && opt.ingredientName.toLowerCase().includes(ingNameLower)) ||
              (opt.optionName && opt.optionName.toLowerCase().includes(ingNameLower))
            ) || (item.notes && item.notes.toLowerCase().includes(ingNameLower))

            if (!isSelected) {
              continue
            }
          }

          // Exact cup size scaling if configured
          let qtyPerServing = recipe.quantity
          if (recipe.sizeMultipliers) {
            try {
              const multipliers = typeof recipe.sizeMultipliers === 'string'
                ? JSON.parse(recipe.sizeMultipliers)
                : recipe.sizeMultipliers
              if (multipliers[sizeKey] !== undefined) {
                qtyPerServing = parseFloat(multipliers[sizeKey]) || recipe.quantity
              } else if (sizeKey === 'XL' && multipliers['L'] !== undefined) {
                qtyPerServing = parseFloat(multipliers['L']) || recipe.quantity
              }
            } catch (err) {
              console.error('Error parsing recipe sizeMultipliers:', err)
            }
          }

          // If the modifier in selectedOptions explicitly specifies a quantityDeducted for this ingredient,
          // prefer the option's specific quantity if no sizeMultiplier was set
          const matchedOpt = item.selectedOptions?.find((opt: any) =>
            opt.ingredientId === recipe.ingredientId ||
            (opt.ingredientName && opt.ingredientName.toLowerCase().includes(recipe.ingredient.name.toLowerCase())) ||
            (opt.optionName && opt.optionName.toLowerCase().includes(recipe.ingredient.name.toLowerCase()))
          )

          if (matchedOpt && !recipe.sizeMultipliers && matchedOpt.quantityDeducted) {
            qtyPerServing = parseFloat(String(matchedOpt.quantityDeducted)) || qtyPerServing
          }

          const totalIngredientQuantity = qtyPerServing * itemQuantity
          const remainingQty = Math.max(0, Math.round((recipe.ingredient.quantity - totalIngredientQuantity) * 1000) / 1000)
          await tx.ingredient.update({
            where: { id: recipe.ingredientId },
            data: {
              quantity: remainingQty
            }
          })
          deductedIngredientIds.add(recipe.ingredientId)
        }

        // 4c. Deduct chosen modifier ingredients (e.g. Oat Milk, Ethiopian Beans, Gluten-Free Bread)
        if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
          for (const opt of item.selectedOptions) {
            // Ignore size/temperature/ice which are not inventory ingredients
            const grp = (opt.groupName || '').toLowerCase()
            if (grp === 'size' || grp === 'temperature' || grp === 'ice' || grp === 'sweetness' || grp === 'note') {
              continue
            }

            let targetIngredientId = opt.ingredientId

            // If ingredient ID not supplied, search by option name / ingredient name
            if (!targetIngredientId && (opt.optionName || opt.ingredientName)) {
              const searchName = opt.ingredientName || opt.optionName
              const matchedIng = await tx.ingredient.findFirst({
                where: {
                  tenantId,
                  name: { contains: searchName }
                }
              })
              if (matchedIng) {
                targetIngredientId = matchedIng.id
              }
            }

            // AVOID DOUBLE DEDUCTION: If already deducted via recipe scaling in 4b, skip
            if (targetIngredientId && deductedIngredientIds.has(targetIngredientId)) {
              continue
            }

            if (targetIngredientId) {
              const qtyPerServing = parseFloat(String(opt.quantityDeducted)) || 1
              const totalToDeduct = qtyPerServing * itemQuantity
              const ingRecord = await tx.ingredient.findUnique({
                where: { id: targetIngredientId }
              })
              if (ingRecord) {
                await tx.ingredient.update({
                  where: { id: targetIngredientId },
                  data: {
                    quantity: Math.max(0, ingRecord.quantity - totalToDeduct)
                  }
                })
                deductedIngredientIds.add(targetIngredientId)
                try {
                  await tx.stockMovement.create({
                    data: {
                      tenantId,
                      type: 'out_recipe_pos',
                      ingredientId: targetIngredientId,
                      quantity: totalToDeduct,
                      unitCost: ingRecord.costPerUnit || 0,
                      totalAmount: (ingRecord.costPerUnit || 0) * totalToDeduct,
                      reference: `Order #${orderNumber}`,
                      notes: `${opt.groupName || 'Item Add-on'}: ${ingRecord.name}`
                    }
                  })
                } catch {}
              }
            }
          }
        } else if (item.notes) {
          // Fallback deduction based on notes text
          const notesLower = String(item.notes).toLowerCase()
          if (notesLower.includes('oat milk')) {
            const oatIng = await tx.ingredient.findFirst({
              where: { tenantId, name: { contains: 'Oat' } }
            })
            if (oatIng) {
              await tx.ingredient.update({
                where: { id: oatIng.id },
                data: { quantity: Math.max(0, oatIng.quantity - (220 * itemQuantity)) }
              })
            }
          } else if (notesLower.includes('almond milk')) {
            const almondIng = await tx.ingredient.findFirst({
              where: { tenantId, name: { contains: 'Almond' } }
            })
            if (almondIng) {
              await tx.ingredient.update({
                where: { id: almondIng.id },
                data: { quantity: Math.max(0, almondIng.quantity - (220 * itemQuantity)) }
              })
            }
          } else if (notesLower.includes('whole milk') || notesLower.includes('regular milk')) {
            const milkIng = await tx.ingredient.findFirst({
              where: { tenantId, name: { contains: 'Whole' } }
            })
            if (milkIng) {
              await tx.ingredient.update({
                where: { id: milkIng.id },
                data: { quantity: Math.max(0, milkIng.quantity - (220 * itemQuantity)) }
              })
            }
          }

          if (notesLower.includes('extra shot')) {
            const coffeeIng = await tx.ingredient.findFirst({
              where: { tenantId, name: { contains: 'Bean' } }
            })
            if (coffeeIng) {
              await tx.ingredient.update({
                where: { id: coffeeIng.id },
                data: { quantity: Math.max(0, coffeeIng.quantity - (18 * itemQuantity)) }
              })
            }
          }
        }

        // 4d. Fallback packaging deduction (Hot/Cold Cups & Lids, Meal Boxes & Bags) from MenuItem options config
        const dbItem = menuItemMap.get(item.menuItemId)
        if (dbItem?.options) {
          try {
            const parsedCustomization = parseItemCustomization(dbItem.options)
            const tempOpt = item.selectedOptions?.find((o: any) => o.groupName?.toLowerCase() === 'temperature')
            const tempText = (tempOpt?.optionName || item.notes || '').toLowerCase()
            const isHot = !tempText || tempText.includes('hot') || tempText.includes('room')

            if (parsedCustomization.itemType === 'drink' && parsedCustomization.drinkConfig?.sizes) {
              const matchedSize = parsedCustomization.drinkConfig.sizes.find((s: any) =>
                s.name.toLowerCase() === sizeText.toLowerCase() ||
                (sizeKey === 'S' && s.name.toLowerCase().includes('small')) ||
                (sizeKey === 'M' && s.name.toLowerCase().includes('medium')) ||
                (sizeKey === 'L' && s.name.toLowerCase().includes('large')) ||
                (sizeKey === 'XL' && (s.name.toLowerCase().includes('extra') || s.name.toLowerCase().includes('xl')))
              ) || parsedCustomization.drinkConfig.sizes[0]

              if (matchedSize) {
                const cupId = isHot
                  ? (matchedSize.hotCupIngredientId || matchedSize.cupIngredientId)
                  : (matchedSize.coldCupIngredientId || matchedSize.cupIngredientId)
                const lidId = isHot
                  ? (matchedSize.hotLidIngredientId || matchedSize.lidIngredientId)
                  : (matchedSize.coldLidIngredientId || matchedSize.lidIngredientId)

                for (const pkgId of [cupId, lidId].filter(Boolean)) {
                  if (pkgId && !deductedIngredientIds.has(pkgId)) {
                    const ing = await tx.ingredient.findUnique({ where: { id: pkgId } })
                    if (ing) {
                      await tx.ingredient.update({
                        where: { id: pkgId },
                        data: { quantity: Math.max(0, ing.quantity - (1 * itemQuantity)) }
                      })
                      deductedIngredientIds.add(pkgId)
                      try {
                        await tx.stockMovement.create({
                          data: {
                            tenantId,
                            type: 'out_recipe_pos',
                            ingredientId: pkgId,
                            quantity: 1 * itemQuantity,
                            unitCost: ing.costPerUnit || 0,
                            totalAmount: (ing.costPerUnit || 0) * (1 * itemQuantity),
                            reference: `Order #${orderNumber}`,
                            notes: `Packaging: ${ing.name} for ${dbItem.name}`
                          }
                        })
                      } catch {}
                    }
                  }
                }
              }
            } else if (parsedCustomization.itemType === 'food' && parsedCustomization.foodConfig?.portions) {
              const matchedPortion = parsedCustomization.foodConfig.portions.find((p: any) =>
                p.name.toLowerCase() === sizeText.toLowerCase()
              ) || parsedCustomization.foodConfig.portions[0]

              if (matchedPortion) {
                for (const pkgId of [matchedPortion.packagingIngredientId, matchedPortion.secondaryPackagingIngredientId].filter(Boolean)) {
                  if (pkgId && !deductedIngredientIds.has(pkgId)) {
                    const ing = await tx.ingredient.findUnique({ where: { id: pkgId } })
                    if (ing) {
                      await tx.ingredient.update({
                        where: { id: pkgId },
                        data: { quantity: Math.max(0, ing.quantity - (1 * itemQuantity)) }
                      })
                      deductedIngredientIds.add(pkgId)
                      try {
                        await tx.stockMovement.create({
                          data: {
                            tenantId,
                            type: 'out_recipe_pos',
                            ingredientId: pkgId,
                            quantity: 1 * itemQuantity,
                            unitCost: ing.costPerUnit || 0,
                            totalAmount: (ing.costPerUnit || 0) * (1 * itemQuantity),
                            reference: `Order #${orderNumber}`,
                            notes: `Packaging: ${ing.name} for ${dbItem.name}`
                          }
                        })
                      } catch {}
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.error('Packaging fallback deduction error:', e)
          }
        }
      }

      // 5. Create SyncEvent for offline/cloud delta sync
      await tx.syncEvent.create({
        data: {
          tenantId,
          deviceId: deviceId || 'main-pos',
          entityType: 'order',
          entityId: createdOrder.id,
          action: 'create',
          payload: JSON.stringify({
            orderNumber: createdOrder.orderNumber,
            totalAmount: createdOrder.totalAmount,
            status: createdOrder.orderStatus,
            itemsCount: validatedItems.length
          })
        }
      })

      // 6. If a registered DB promo code was applied, increment its usage counter
      if (matchedDbPromoId) {
        await tx.promoCode.update({
          where: { id: matchedDbPromoId },
          data: { usedCount: { increment: 1 } }
        })
      }

      return createdOrder
    })

    // 6. Log audit if discount applied
    if (parseFloat(discount) > 0) {
      await logAuditEvent({
        tenantId,
        staffId,
        action: 'discount_applied',
        entityType: 'order',
        entityId: order.id,
        afterValue: { discount: parseFloat(discount), totalAmount: order.totalAmount },
        notes: `Discount applied to order #${order.orderNumber}`
      })
    }

    // 7. Auto-post double-entry accounting journal entry
    try {
      await postPOSOrderJournal(order.id, tenantId)
    } catch (journalErr) {
      console.error('Warning: Failed to auto-post accounting journal for order:', journalErr)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
