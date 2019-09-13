import {
  changeAccount,
  clearCookies,
  waitForText,
  clickByText,
  clickBySelector,
  pic,
  createAccount,
  giveRating,
  waitUntilTextHides
} from './_helpers'
import services from './_services'
import assert from 'assert'

let page

before(async function() {
  this.timeout(60000)
  page = (await services()).extrasResult.page
})

const reset = async (sellerOgn, reload = false) => {
  // clear cookies (for messaging)
  await clearCookies(page)

  await page.evaluate(reload => {
    window.transactionPoll = 100
    window.sessionStorage.clear()
    window.location = '/#/'
    /* Some tests require reload... e.g. to reset messaging
     * initialisation.
     */
    if (reload) {
      window.location.reload(true)
    }
  }, reload)

  if (reload) {
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
  }

  const seller = await createAccount(page, sellerOgn)
  const buyer = await createAccount(page)

  return { buyer, seller }
}

const purchaseListing = async ({ buyer, withShipping, title }) => {
  await pic(page, 'listing-detail')
  await changeAccount(page, buyer)

  await clickByText(page, 'Purchase', 'a')

  if (withShipping) {
    await page.waitForSelector('.shipping-address-form [name=name]')
    await page.type('.shipping-address-form [name=name]', 'Bruce Wayne')
    await page.type('.shipping-address-form [name=address1]', '123 Wayne Towers')
    await page.type('.shipping-address-form [name=city]', 'Gotham City')
    await page.type('.shipping-address-form [name=stateProvinceRegion]', 'New Jersey')
    await page.type('.shipping-address-form [name=postalCode]', '123456')
    await page.type('.shipping-address-form [name=country]', 'USA')

    await clickByText(page, 'Continue', 'button')
  }

  // Purchase confirmation
  await waitForText(page, 'Please confirm your purchase', 'h1')
  await pic(page, 'purchase-confirmation')
  
  await waitForText(page, 'Total Price')

  const summaryEls = await page.$('.summary')
  const summaryText = await page.evaluate(el => el.innerText, summaryEls)

  if (withShipping) {
    assert(summaryText.replace(/[\n\t\r ]+/g, ' ') === `Item ${title} Shipping Address Bruce Wayne 123 Wayne Towers Gotham City New Jersey 123456 USA Total Price $1 Payment 0.00632 ETH`, 'Invalid Summary')
  } else {
    assert(summaryText.replace(/[\n\t\r ]+/g, ' ') === `Item ${title} Total Price $1 Payment 0.00632 ETH`, 'Invalid Summary')
  }

  await clickByText(page, 'Purchase', 'button')

  await waitForText(page, 'View Purchase Details', 'button')
  await pic(page, 'purchase-listing')

  await clickByText(page, 'View Purchase Details', 'button')
  await waitForText(page, 'Transaction History')
  await pic(page, 'transaction-wait-for-seller')
}

const purchaseListingWithDAI = async ({ buyer, autoSwap, withShipping, title }) => {
  await pic(page, 'listing-detail')
  await changeAccount(page, buyer)

  await clickByText(page, 'Purchase', 'a')

  if (withShipping) {
    await page.waitForSelector('.shipping-address-form [name=name]')
    await page.type('.shipping-address-form [name=name]', 'Bruce Wayne')
    await page.type('.shipping-address-form [name=address1]', '123 Wayne Towers')
    await page.type('.shipping-address-form [name=city]', 'Gotham City')
    await page.type('.shipping-address-form [name=stateProvinceRegion]', 'New Jersey')
    await page.type('.shipping-address-form [name=postalCode]', '123456')
    await page.type('.shipping-address-form [name=country]', 'USA')

    await clickByText(page, 'Continue', 'button')
  }

  // Purchase confirmation
  await waitForText(page, 'Please confirm your purchase', 'h1')
  await pic(page, 'purchase-confirmation')

  await waitForText(page, 'Total Price')

  const summaryEls = await page.$('.summary')
  const summaryText = await page.evaluate(el => el.innerText, summaryEls)

  if (withShipping) {
    assert(summaryText.replace(/[\n\t\r ]+/g, ' ') === `Item ${title} Shipping Address Bruce Wayne 123 Wayne Towers Gotham City New Jersey 123456 USA Total Price $1 Payment 0.00632 ETH`, 'Invalid Summary')
  } else {
    assert(summaryText.replace(/[\n\t\r ]+/g, ' ') === `Item ${title} Total Price $1 Payment 0.00632 ETH`, 'Invalid Summary')
  }

  await clickByText(page, autoSwap ? 'Purchase' : 'Swap Now', 'button')
}

const purchaseMultiUnitListing = async ({ buyer, withShipping, title }) => {
  await pic(page, 'listing-detail')
  await changeAccount(page, buyer)
  await page.waitForSelector('.quantity select')
  await page.select('.quantity select', '2')

  await clickByText(page, 'Purchase', 'a')

  if (withShipping) {
    await page.waitForSelector('.shipping-address-form [name=name]')
    await page.type('.shipping-address-form [name=name]', 'Bruce Wayne')
    await page.type('.shipping-address-form [name=address1]', '123 Wayne Towers')
    await page.type('.shipping-address-form [name=city]', 'Gotham City')
    await page.type('.shipping-address-form [name=stateProvinceRegion]', 'New Jersey')
    await page.type('.shipping-address-form [name=postalCode]', '123456')
    await page.type('.shipping-address-form [name=country]', 'USA')

    await clickByText(page, 'Continue', 'button')
  }

  // Purchase confirmation
  await waitForText(page, 'Please confirm your purchase', 'h1')
  await pic(page, 'purchase-confirmation')

  await waitForText(page, 'Total Price')

  const summaryEls = await page.$('.summary')
  const summaryText = await page.evaluate(el => el.innerText, summaryEls)

  if (withShipping) {
    assert(summaryText.replace(/[\n\t\r ]+/g, ' ') === `Item ${title} Quantity 2 Shipping Address Bruce Wayne 123 Wayne Towers Gotham City New Jersey 123456 USA Total Price $2 Payment 0.01265 ETH`, 'Invalid Summary')
  } else {
    assert(summaryText.replace(/[\n\t\r ]+/g, ' ') === `Item ${title} Quantity 2 Total Price $2 Payment 0.01265 ETH`, 'Invalid Summary')
  }

  await clickByText(page, 'Purchase', 'button')
  await waitForText(page, 'View Purchase', 'button')
  await pic(page, 'purchase-listing')

  await clickByText(page, 'View Purchase', 'button')
  await waitForText(
    page,
    `You've made an offer. Wait for the seller to accept it.`
  )
  await pic(page, 'transaction-wait-for-seller')
}

const purchaseFractionalListing = async ({ buyer }) => {
  await pic(page, 'listing-detail')
  await changeAccount(page, buyer)

  await clickByText(page, 'Availability', 'button')

  const startDay = await page.$('.calendar:not(:first-child) .days .day:nth-child(9)')
  const endDay = await page.$('.calendar:not(:first-child) .days .day:nth-child(15)')
  await startDay.click()
  await endDay.click()

  await clickByText(page, 'Save', 'button')

  await waitUntilTextHides(page, 'Save', 'button')

  await waitForText(page, 'Total Price')

  await clickByText(page, 'Book')

  // Purchase confirmation
  await waitForText(page, 'Please confirm your purchase', 'h1')
  await pic(page, 'purchase-confirmation')
  
  await waitForText(page, 'Total Price')

  // TODO: Find a way to verify check in and check out dates in summary

  await waitForText(page, 'Check In')
  await waitForText(page, 'Check Out')

  await clickByText(page, 'Book', 'button')

  await waitForText(page, 'View Purchase Details', 'button')
  await pic(page, 'purchase-listing')

  await clickByText(page, 'View Purchase Details', 'button')
  await waitForText(page, 'Transaction History')
  await pic(page, 'transaction-wait-for-seller')
}

const acceptOffer = async ({ seller }) => {
  await changeAccount(page, seller)
  await waitForText(page, 'Accept Offer', 'button')
  await pic(page, 'transaction-accept')

  await clickByText(page, 'Accept Offer', 'button')
  await clickByText(page, 'OK', 'button')
  await waitForText(page, `You've accepted this offer`)
  await pic(page, 'transaction-accepted')
}

const confirmReleaseFundsAndRate = async ({ buyer, review }) => {
  await changeAccount(page, buyer)
  await waitForText(page, 'Seller has accepted your offer.')
  await pic(page, 'transaction-confirm')
  await clickByText(page, 'Confirm receipt', 'button')
  await waitForText(page, 'Release the funds to the seller.')
  await pic(page, 'transaction-release-funds')
  await clickByText(page, 'Release Funds', 'button')
  await pic(page, 'transaction-release-funds-confirmation')
  await clickByText(page, 'Yes, please', 'button')
  await waitForText(page, 'Success!')
  await clickByText(page, 'OK', 'button')
  await waitForText(page, 'Leave a review of the seller')
  await giveRating(page, 3)
  if (review) {
    await page.type('textarea', review)
  }
  await pic(page, 'transaction-release-funds-rated')
  await clickByText(page, 'Submit', 'button')
  await waitForText(page, 'Success!')
  await clickByText(page, 'OK', 'button')
  await waitForText(page, 'Your purchase is complete.')
  await pic(page, 'transaction-release-funds-finalized')
}

function randomTitle({ isFractional } = {}) {
  if (isFractional) {
    return `3BHK apartment ${Math.floor(Math.random() * 100000)}`
  }
  return `T-Shirt ${Math.floor(Math.random() * 100000)}`
}

function randomReview() {
  return `Very good ${Math.floor(Math.random() * 100000)}`
}

function singleUnitTests({ autoSwap, withShipping, EthAndDaiAccepted } = {}) {
  describe(`Single Unit Listing${withShipping ? ' with Shipping' : ''} ${EthAndDaiAccepted ? ' both ETH and DAI accepted' : ''} payment in ETH`, function() {
    let seller, buyer, title, review
    before(async function() {
      ({ seller, buyer } = await reset('100'))
      title = randomTitle()
      review = randomReview()
    })

    it('should switch to Seller account', async function() {
      await changeAccount(page, seller)
    })

    it('should have no Purchases', async function() {
      await clickByText(page, 'Purchases', 'a/span')
      await waitForText(page, 'You haven’t bought anything yet.')
    })

    it('should have no Listings', async function() {
      await clickByText(page, 'Listings', 'a/span')
      await waitForText(page, "You don't have any listings yet.")
    })

    it('should have no Sales', async function() {
      await clickByText(page, 'Sales', 'a/span')
      await waitForText(page, 'You haven’t sold anything yet.')
    })

    it('should have no Notifications', async function() {
      await clickBySelector(page, '.nav-item.notifications a')
      await page.waitForFunction(
        `(function() {
          try {
            const selector = '.notifications.dropdown .dropdown-menu .count'
            return document.querySelector(selector).innerText.replace(/\\s/, ' ').includes("0 Notifications")
          } catch(e) {
            return false
          }
        })()`
      )
    })

    it('should navigate to the Add Listing page', async function() {
      await clickByText(page, 'Add Listing')
      await pic(page, 'add-listing')
    })

    it('should select For Sale', async function() {
      await clickByText(page, 'For Sale')
    })

    it('should select Clothing', async function() {
      await clickByText(page, 'Clothing and Accessories')
      await pic(page, 'add-listing')
    })

    it('should allow title and description entry', async function() {
      await page.type('input[name=title]', title)
      await page.type('textarea[name=description]', 'T-Shirt in size large')
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow quantity entry', async function() {
      if (!withShipping) {
        await waitForText(page, 'Require Shipping')
        await clickByText(page, 'No')
      }
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow price entry', async function() {
      await page.type('input[name=price]', '1')
      // ETH is deselected in the UI by default. Always select it.
      // DAI is selected in the UI by default. Deselect it if EthAndDaiAccepted is not true.
      await clickByText(page, 'Ethereum')
      if (!EthAndDaiAccepted) {
        await clickByText(page, 'Maker Dai')
      }
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow image entry', async function() {
      const input = await page.$('input[type="file"]')
      await input.uploadFile(__dirname + '/fixtures/image-1.jpg')
      await page.waitForSelector('.image-picker .preview-row')
      await pic(page, 'add-listing')
    })

    it('should continue to review', async function() {
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should create listing', async function() {
      await clickByText(page, 'Publish', 'button')
      await waitForText(page, 'Promote Now', 'a')
      await pic(page, 'add-listing')
    })

    it('should continue to listing', async function() {
      await clickByText(page, 'View My Listing', 'a')
    })

    it('should have listing under Listings tab', async function() {
      await clickByText(page, 'Listings', 'a/span')
      await waitForText(page, 'Listings', 'h1')
      await waitForText(page, title, 'a')
      await clickByText(page, title, 'a')
    })

    it('should continue to listing promotion', async function() {
      await clickByText(page, 'Promote Now', 'a')
    })

    it('should continue to OGN entry', async function() {
      await clickByText(page, 'Continue', 'a')
    })

    it('should wait for correct OGN balance', async function() {
      await page.waitForFunction(
        `document.querySelector('.promote-listing .balance').innerText.includes("OGN Balance: 100")`
      )
    })

    it('should enter 10 OGN', async function() {
      await page.type('input[name=commissionPerUnit]', '10')
    })

    it('should allow promotion tx', async function() {
      await clickByText(page, 'Promote Now', 'button')
    })

    if (autoSwap) {
      it('should prompt the user to approve their OGN', async function() {
        await clickByText(page, 'Promote Now', 'button')
      })
    }

    it('should allow listing to be viewed', async function() {
      await clickByText(page, 'View My Listing', 'a')
    })

    it('should allow a new listing to be purchased', async function() {
      await purchaseListing({ buyer, withShipping, title })
      // Payment should always be in ETH, even if both ETH and DAI are accepted.
      await page.waitForFunction(
        `document.querySelector('.escrow-amount').innerText.includes("ETH")`
      )
    })

    it('should allow a new listing to be accepted', async function() {
      await acceptOffer({ seller })
    })

    it('should allow a new listing to be finalized', async function() {
      await confirmReleaseFundsAndRate({ buyer, review })
    })

    it('should have review on listing', async function() {
      await clickByText(page, 'View Listing', 'li/div/a')
      await waitForText(page, review, 'div')
    })

    it('should have purchase in Complete Purchases tab', async function() {
      await clickByText(page, 'Purchases', 'a/span')
      await waitForText(page, 'Purchases', 'h1')
      await clickByText(page, 'Complete', 'a')
      await waitForText(page, title, 'a')
    })
  })
}

function singleUnitDaiTests({ autoSwap, withShipping } = {}) {
  describe(`Single Unit Listing${withShipping ? ' with Shipping' : ''} payment in DAI`, function() {
    let seller, buyer
    let title
    before(async function() {
      ({ seller, buyer } = await reset())
      title = randomTitle()
    })

    it('should navigate to the Add Listing page', async function() {
      await changeAccount(page, seller)
      await clickByText(page, 'Add Listing')
      await pic(page, 'add-listing')
    })

    it('should select For Sale', async function() {
      await clickByText(page, 'For Sale')
    })

    it('should select Clothing', async function() {
      await clickByText(page, 'Clothing and Accessories')
      await pic(page, 'add-listing')
    })

    it('should allow title and description entry', async function() {
      await page.type('input[name=title]', title)
      await page.type('textarea[name=description]', 'T-Shirt in size large')
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow quantity entry', async function() {
      if (!withShipping) {
        await waitForText(page, 'Require Shipping')
        await clickByText(page, 'No')
      }

      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow price entry', async function() {
      await page.type('input[name=price]', '1')
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow image entry', async function() {
      const input = await page.$('input[type="file"]')
      await input.uploadFile(__dirname + '/fixtures/image-1.jpg')
      await page.waitForSelector('.image-picker .preview-row')
      await pic(page, 'add-listing')
    })

    it('should continue to review', async function() {
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should create listing', async function() {
      await clickByText(page, 'Publish', 'button')
      await waitForText(page, 'View My Listing', 'a')
      await pic(page, 'add-listing')
    })

    it('should continue to listing', async function() {
      await clickByText(page, 'View My Listing', 'a')
      await pic(page, 'listing-detail')
    })

    it('should allow a new listing to be purchased', async function() {
      await purchaseListingWithDAI({ buyer, autoSwap, withShipping, title })
    })

    if (!autoSwap) {
      it('should prompt the user to approve their Dai', async function() {
        await waitForText(page, 'Approve', 'button')
        await pic(page, 'listing-detail')
        await clickByText(page, 'Approve', 'button')

        await waitForText(page, 'Origin may now move DAI on your behalf.')
        await pic(page, 'listing-detail')
      })

      it('should prompt to continue with purchase', async function() {
        await clickByText(page, 'Continue', 'button')
        await waitForText(page, 'View Purchase', 'button')
        await pic(page, 'purchase-listing')
      })
    }

    it('should view the purchase', async function() {
      await clickByText(page, 'View Purchase', 'button')
      await waitForText(
        page,
        `You've made an offer. Wait for the seller to accept it.`
      )
      await pic(page, 'transaction-wait-for-seller')
    })

    it('should allow a new listing to be accepted', async function() {
      await acceptOffer({ seller })
    })

    it('should allow a new listing to be finalized', async function() {
      await confirmReleaseFundsAndRate({ buyer })
    })
  })
}

function multiUnitTests({ autoSwap, withShipping } = {}) {
  describe(`Multi Unit Listing${withShipping ? ' with Shipping' : ''} payment in ETH`, function() {
    let seller, buyer, title, listingHash
    before(async function() {
      ({ seller, buyer } = await reset('100'))
      title = randomTitle()
    })

    it('should navigate to the Add Listing page', async function() {
      await changeAccount(page, seller)
      await clickByText(page, 'Add Listing')
      await pic(page, 'add-listing')
    })

    it('should select For Sale', async function() {
      await clickByText(page, 'For Sale')
    })

    it('should select Clothing', async function() {
      await clickByText(page, 'Clothing and Accessories')
      await pic(page, 'add-listing')
    })

    it('should allow title and description entry', async function() {
      await page.type('input[name=title]', title)
      await page.type('textarea[name=description]', 'T-Shirt in size large')
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow detail entry', async function() {
      await page.focus('input[name=quantity]')
      await page.keyboard.press('Backspace')
      await page.type('input[name=quantity]', '2')

      if (!withShipping) {
        await waitForText(page, 'Require Shipping')
        await clickByText(page, 'No')
      }

      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow price entry', async function() {
      await page.type('input[name=price]', '1')
      await clickByText(page, 'Ethereum') // Select Eth
      await clickByText(page, 'Maker Dai') // De-select Dai
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow image entry', async function() {
      const input = await page.$('input[type="file"]')
      await input.uploadFile(__dirname + '/fixtures/image-1.jpg')
      await page.waitForSelector('.image-picker .preview-row')
      await pic(page, 'add-listing')
    })

    it('should continue to review', async function() {
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should create listing', async function() {
      await clickByText(page, 'Publish', 'button')
      await waitForText(page, 'Promote Now')
      await pic(page, 'add-listing')
    })

    it('should continue to listing promotion', async function() {
      await clickByText(page, 'Promote Now', 'a')
    })

    it('should continue to OGN entry', async function() {
      await clickByText(page, 'Continue', 'a')
    })

    it('should wait for correct OGN balance', async function() {
      await page.waitForFunction(
        `document.querySelector('.promote-listing .balance').innerText.includes("OGN Balance: 100")`
      )
    })

    it('should enter 10 OGN', async function() {
      await page.type('input[name=commissionPerUnit]', '10')
    })

    it('should continue to OGN budget', async function() {
      await clickByText(page, 'Continue', 'a')
    })

    it('should allow promotion tx', async function() {
      await clickByText(page, 'Promote Now', 'button')
    })

    if (autoSwap) {
      it('should prompt the user to approve their OGN', async function() {
        await clickByText(page, 'Promote Now', 'button')
      })
    }

    it('should allow listing to be viewed', async function() {
      await clickByText(page, 'View My Listing', 'a')
      await waitForText(page, title, 'h2')
      listingHash = await page.evaluate(() => window.location.hash)
    })

    it('should have the correct sales numbers', async function() {
      await page.waitForSelector('.listing-buy-editonly')
      const sold = await page.$('.listing-buy-editonly')
      const sales = await page.evaluate(el => el.innerText, sold)
      assert(
        sales.replace(/[\n\t\r ]+/g, ' ') === 'Sold 0 Pending 0 Available 2'
      )
    })

    it('should have the correct commission numbers', async function() {
      await page.waitForSelector('.listing-commission')
      const commission = await page.$('.listing-commission')
      const commissionTxt = await page.evaluate(el => el.innerText, commission)
      assert(
        commissionTxt
          .replace(/[\n\t\r ]+/g, ' ')
          .startsWith(
            'Commission per Unit 10 Total Budget 20 Total Budget Remaining 20'
          )
      )
    })

    it('should allow a new listing to be purchased', async function() {
      await purchaseMultiUnitListing({ buyer, withShipping, title })
    })

    it('should allow a new listing to be accepted', async function() {
      await acceptOffer({ seller })
    })

    it('should allow a new listing to be finalized', async function() {
      await confirmReleaseFundsAndRate({ buyer })
    })

    it('should navigate back to the listing', async function() {
      await changeAccount(page, seller)
      await page.evaluate(l => {
        window.location = l
      }, `/${listingHash}`)
    })

    it('should allow the listing to be edited', async function() {
      await clickBySelector(
        page,
        '.listing-buy-editonly + a.listing-action-link'
      )
      await clickByText(page, 'For Sale')
      await clickByText(page, 'Continue')
      await page.focus('input[name=quantity]')
      await page.keyboard.press('Backspace')
      await page.type('input[name=quantity]', '10')
      await clickByText(page, 'Continue')
      await clickByText(page, 'Continue')
      await clickByText(page, 'Continue')
      await clickByText(page, 'Publish', 'button')
      await clickByText(page, 'View My Listing', 'a')
    })

    it('should have the edited sales numbers', async function() {
      await page.waitForSelector('.listing-buy-editonly')
      const sold = await page.$('.listing-buy-editonly')
      const sales = await page.evaluate(el => el.innerText, sold)
      assert(
        sales.replace(/[\n\t\r ]+/g, ' ') === `Sold 2 Pending 0 Available 8`
      )
    })

    it('should have the updated commission numbers', async function() {
      await page.waitForSelector('.listing-commission')
      const commission = await page.$('.listing-commission')
      const commissionTxt = await page.evaluate(el => el.innerText, commission)
      assert(
        commissionTxt
          .replace(/[\n\t\r ]+/g, ' ')
          .startsWith(
            'Commission per Unit 10 Total Budget 20 Total Budget Remaining 0'
          )
      )
    })

    it('should allow the edited listing to be purchased', async function() {
      await purchaseMultiUnitListing({ buyer, withShipping, title })
    })

    it('should allow a new listing to be accepted', async function() {
      await acceptOffer({ seller })
    })

    it('should allow a new listing to be finalized', async function() {
      await confirmReleaseFundsAndRate({ buyer })
    })
  })
}

function fractionalTests({ autoSwap } = {}) {
  describe(`Fractional Listing for Eth`, function() {
    let seller, buyer, title, review
    before(async function() {
      ({ seller, buyer } = await reset('100'))
      title = randomTitle({ isFractional: true })
      review = randomReview()
    })

    it('should switch to Seller account', async function() {
      await changeAccount(page, seller)
    })

    it('should have no Purchases', async function() {
      await clickByText(page, 'Purchases', 'a/span')
      await waitForText(page, 'You haven’t bought anything yet.')
    })

    it('should have no Listings', async function() {
      await clickByText(page, 'Listings', 'a/span')
      await waitForText(page, "You don't have any listings yet.")
    })

    it('should have no Sales', async function() {
      await clickByText(page, 'Sales', 'a/span')
      await waitForText(page, 'You haven’t sold anything yet.')
    })

    it('should have no Notifications', async function() {
      await clickBySelector(page, '.nav-item.notifications a')
      await page.waitForFunction(
        `(function() {
          try {
            const selector = '.notifications.dropdown .dropdown-menu .count'
            return document.querySelector(selector).innerText.replace(/\\s/, ' ').includes("0 Notifications")
          } catch(e) {
            return false
          }
        })()`
      )
    })

    it('should navigate to the Add Listing page', async function() {
      await clickByText(page, 'Add Listing')
      await pic(page, 'add-listing')
    })

    it('should select For Rent', async function() {
      await clickByText(page, 'For Rent')
    })

    it('should select Housing', async function() {
      await clickByText(page, 'Housing')
      await pic(page, 'add-listing')
    })

    it('should allow title and description entry', async function() {
      await page.type('input[name=title]', title)
      await page.type('textarea[name=description]', 'T-Shirt in size large')
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow price entry', async function() {
      await page.type('input[name=price]', '1')
      await page.type('input[name=weekendPrice]', '1')
      await clickByText(page, 'Ethereum') // Select Eth
      await clickByText(page, 'Maker Dai') // De-select Dai
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should allow changing availability and custom prices', async () => {
      await waitForText(page, 'Availability', 'h1')
      // TODO: To be updated after #3351 is fixed
      // const startDay = await page.$('.calendar:not(:first-child) .days .day:nth-child(9)')
      // const endDay = await page.$('.calendar:not(:first-child) .days .day:nth-child(15)')
      // await startDay.click()
      // await endDay.click()

      // const availabilityNo = await page.$('.availability-editor .form-group input[type=radio]')
      // await availabilityNo.click()

      // await clickByText(page, 'Save', 'button')

      await clickByText(page, 'Continue', 'button')
    })

    it('should allow image entry', async function() {
      const input = await page.$('input[type="file"]')
      await input.uploadFile(__dirname + '/fixtures/image-1.jpg')
      await page.waitForSelector('.image-picker .preview-row')
      await pic(page, 'add-listing')
    })

    it('should continue to review', async function() {
      await clickByText(page, 'Continue')
      await pic(page, 'add-listing')
    })

    it('should create listing', async function() {
      await clickByText(page, 'Publish', 'button')
      await waitForText(page, 'Promote Now', 'a')
      await pic(page, 'add-listing')
    })

    it('should continue to listing', async function() {
      await clickByText(page, 'View My Listing', 'a')
    })

    it('should have listing under Listings tab', async function() {
      await clickByText(page, 'Listings', 'a/span')
      await waitForText(page, 'Listings', 'h1')
      await waitForText(page, title, 'a')
      await clickByText(page, title, 'a')
    })

    it('should continue to listing promotion', async function() {
      await clickByText(page, 'Promote Now', 'a')
    })

    it('should continue to OGN entry', async function() {
      await clickByText(page, 'Continue', 'a')
    })

    it('should wait for correct OGN balance', async function() {
      await page.waitForFunction(
        `document.querySelector('.promote-listing .balance').innerText.includes("OGN Balance: 100")`
      )
    })

    it('should enter 10 OGN', async function() {
      await page.type('input[name=commissionPerUnit]', '10')
      await clickByText(page, 'Continue', 'a')
    })

    it('should allow promotion tx', async function() {
      await clickByText(page, 'Promote Now', 'button')
    })

    if (autoSwap) {
      it('should prompt the user to approve their OGN', async function() {
        await clickByText(page, 'Promote Now', 'button')
      })
    }

    it('should allow listing to be viewed', async function() {
      await clickByText(page, 'View My Listing', 'a')
    })

    it('should allow a new listing to be purchased', async function() {
      await purchaseFractionalListing({ buyer })
    })

    it('should allow a new listing to be accepted', async function() {
      await acceptOffer({ seller })
    })

    it('should allow a new listing to be finalized', async function() {
      await confirmReleaseFundsAndRate({ buyer, review })
    })

    it('should have review on listing', async function() {
      await clickByText(page, 'View Listing', 'li/div/a')
      await waitForText(page, review, 'div')
    })

    it('should have purchase in Complete Purchases tab', async function() {
      await clickByText(page, 'Purchases', 'a/span')
      await waitForText(page, 'Purchases', 'h1')
      await clickByText(page, 'Complete', 'a')
      await waitForText(page, title, 'a')
    })
  })
}

function listingTests({ autoSwap } = {}) {
  singleUnitTests({ autoSwap })
  singleUnitTests({ autoSwap, EthAndDaiAccepted: true })
  singleUnitTests({ autoSwap, withShipping: true })
  singleUnitDaiTests({ autoSwap })
  singleUnitDaiTests({ autoSwap, withShipping: true })
  multiUnitTests({ autoSwap })
  multiUnitTests({ autoSwap, withShipping: true })
  fractionalTests({ autoSwap })
}

function userProfileTests() {
  describe('Edit user profile', function() {
    before(async function() {
      const { seller } = await reset()
      await changeAccount(page, seller)
    })

    it('should go to the profile page', async function() {
      await page.evaluate(() => {
        window.location = '/#/profile'
      })
      await pic(page, 'profile-page')
    })

    it('should open the edit modal', async function() {
      await clickBySelector(page, '.profile-page .profile-edit-icon')
    })

    it('should enter new profile information', async function() {
      await page.waitForSelector('input[name=firstName]')
      await page.type('input[name=firstName]', 'Amerigo vespucci')
      await page.type('input[name=lastName]', 'Vespucci')
      await page.type(
        'textarea[name=description]',
        `In that hemisphere I have seen things not compatible with the opinions of philosophers.`
      )
      await pic(page, 'profile-edit-modal')
    })

    it('should close the edit modal', async function() {
      await clickByText(page, 'Save', 'button')
      await page.waitForSelector('.pl-modal', { hidden: true })
    })

    it('should reach a success page', async function() {
      await waitForText(page, 'Profile updated')
      await pic(page, 'profile-edited')
    })
  })
}

function onboardingTests() {
  describe('Complete onboarding', function() {
    before(async function() {
      this.timeout(10000)
      const { seller, buyer } = await reset('100', true)
      await page.evaluate(() => {
        localStorage.clear()
        window.location = '/#/'
      })
      await changeAccount(page, buyer)
      await changeAccount(page, seller, true)
    })

    it('should be redirected to onboarding page', async function() {
      this.timeout(8000)
      await page.evaluate(() => {
        window.location = '/#/profile'
      })

      await waitForText(page, 'Connect a Crypto Wallet')
    })

    it('should enable messaging', async function() {
      this.timeout(8000)
      await page.reload()
      await page.evaluate(() => {
        window.location = '/#/onboard/messaging'
      })

      await waitForText(page, '0 of 2 MetaMask messages signed')
      await clickByText(page, 'Enable Origin Messaging', 'button')

      await waitForText(
        page,
        'Congratulations! You can now message other users'
      )
      await clickByText(page, 'Continue', 'a')
    })
  })
}

describe('Marketplace Dapp', function() {
  this.timeout(10000)
  before(async function() {
    await page.evaluate(() => {
      window.localStorage.clear()
      window.localStorage.bypassOnboarding = true
      window.localStorage.promoteEnabled = 'true'
      window.transactionPoll = 100
    })
    await page.goto('http://localhost:8083')
  })

  listingTests()
  userProfileTests()
  onboardingTests()
})

describe('Marketplace Dapp with proxies enabled', function() {
  this.timeout(10000)
  before(async function() {
    await page.evaluate(() => {
      window.localStorage.clear()
      window.localStorage.proxyAccountsEnabled = true
      window.localStorage.bypassOnboarding = true
      window.localStorage.promoteEnabled = 'true'
      window.transactionPoll = 100
    })
    await page.goto('http://localhost:8083')
  })
  listingTests({ autoSwap: true })
  userProfileTests()
  onboardingTests()
})

describe('Marketplace Dapp with proxies, relayer and performance mode enabled', function() {
  this.timeout(10000)

  let didThrow = false
  function pageError(err) {
    didThrow = err
  }

  before(async function() {
    await page.evaluate(() => {
      window.localStorage.clear()
      window.localStorage.bypassOnboarding = true
      window.localStorage.performanceMode = true
      window.localStorage.proxyAccountsEnabled = true
      window.localStorage.relayerEnabled = true
      window.localStorage.debug = 'origin:*'
      window.localStorage.promoteEnabled = 'true'
      window.transactionPoll = 100
    })
    await page.goto('http://localhost:8083')
  })

  beforeEach(() => {
    page.on('pageerror', pageError)
    page.on('error', pageError)
  })

  afterEach(() => {
    page.removeListener('pageerror', pageError)
    page.removeListener('error', pageError)
    assert(!didThrow, 'Page error detected: ' + didThrow)
  })

  listingTests({ autoSwap: true })
  userProfileTests()
  onboardingTests()
})
