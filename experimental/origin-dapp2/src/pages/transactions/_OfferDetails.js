import React from 'react'

const OfferDetails = () => (
  <ul className="offer-details list-unstyled">
    <li className="price-unit">
      <span>Price/unit</span>
      <span>1.22222 ETH</span>
    </li>
    <li className="quantity">
      <span>Quantity</span>
      <span>5</span>
    </li>
    <li className="total-price">
      <span>Total Price</span>
      <span>6.00000 ETH</span>
    </li>
    <li className="payment-status">
      <span>Payment Status</span>
      <span>In Escrow</span>
    </li>
    <li className="offer-date">
      <span>Offer Date</span>
      <span>Nov. 7, 2018</span>
    </li>
    <li className="offer-number">
      <span>Offer Number</span>
      <span>1-001-123</span>
    </li>
    <li className="start-date">
      <span>Start Date</span>
      <span>Nov. 15, 2018</span>
    </li>
    <li className="end-date">
      <span>End Date</span>
      <span>Nov. 20, 2018</span>
    </li>
    <li className="security-deposit">
      <span>Security Deposit</span>
      <span>$200.00</span>
    </li>
    <li className="damages">
      <span>Damages</span>
      <span>$100.00</span>
    </li>
  </ul>
)

export default OfferDetails

require('react-styl')(`
  .offer-details
    background: var(--pale-grey-eight)
    border-radius: 5px
    font-size: 18px
    font-weight: normal
    padding: 1rem 1.5rem
    li
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0 0.375rem 1.25rem
      span:nth-child(1)
        color: var(--dusk)
      span:nth-child(2)
        color: #000
      background-position: left center
      background-repeat: no-repeat
      background-size: 0.75rem
      &.price-unit
        background-image: url(images/order/price-unit-icon.svg)
      &.quantity
        background-image: url(images/order/quantity-icon.svg)
      &.total-price
        background-image: url(images/order/total-price-icon.svg)
      &.payment-status
        background-image: url(images/order/payment-status-icon.svg)
      &.offer-date
        background-image: url(images/order/offer-date-icon.svg)
      &.offer-number
        background-image: url(images/order/offer-number-icon.svg)
      &.start-date
        background-image: url(images/order/start-date-icon.svg)
      &.end-date
        background-image: url(images/order/end-date-icon.svg)
      &.security-deposit
        background-image: url(images/order/security-deposit-icon.svg)
      &.damages
        background-image: url(images/order/damages-icon.svg)

`)
