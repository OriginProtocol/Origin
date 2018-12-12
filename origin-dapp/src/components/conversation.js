import React, { Component, Fragment } from 'react'
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import moment from 'moment'

import { fetchUser } from 'actions/User'
import { showMainNav } from 'actions/App'

import CompactMessages from 'components/compact-messages'

import { generateCroppedImage } from 'utils/fileUtils'
import { getListing } from 'utils/listing'
import { truncateAddress, formattedAddress, abbreviateName } from 'utils/user'
import { getOfferEvents } from 'utils/offer'

import origin from '../services/origin'

const imageMaxSize = process.env.IMAGE_MAX_SIZE || 2 * 1024 * 1024 // 2 MiB
const formatDate = timestamp => moment(timestamp * 1000).format('MMM D, YYYY')

class Conversation extends Component {
  constructor(props) {
    super(props)

    this.intlMessages = defineMessages({
      newMessagePlaceholder: {
        id: 'conversation.newMessagePlaceholder',
        defaultMessage: 'Type something...'
      },
      offerCreated: {
        id: 'conversation.offerCreated',
        defaultMessage: 'made an offer on'
      },
      offerWithdrawn: {
        id: 'conversation.offerWithdrawn',
        defaultMessage: 'withdrew their offer on'
      },
      offerAccepted: {
        id: 'conversation.offerAccepted',
        defaultMessage: 'accepted the offer on'
      },
      offerDisputed: {
        id: 'conversation.offerDisputed',
        defaultMessage: 'initiated a dispute on'
      },
      offerRuling: {
        id: 'conversation.offerRuling',
        defaultMessage: 'made a ruling on the dispute for'
      },
      offerFinalized: {
        id: 'conversation.offerFinalized',
        defaultMessage: 'finalized the offer for'
      },
      offerData: {
        id: 'conversation.offerData',
        defaultMessage: 'updated information for'
      },
    })

    this.handleClick = this.handleClick.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.loadPurchase = this.loadPurchase.bind(this)
    this.formatOfferMessage = this.formatOfferMessage.bind(this)

    this.conversationDiv = React.createRef()
    this.fileInput = React.createRef()
    this.form = React.createRef()
    this.textarea = React.createRef()

    this.state = {
      counterparty: {},
      files: [],
      listing: {},
      purchase: {},
      invalidTextInput: false
    }
  }

  componentDidMount() {
    const { smallScreenOrDevice, showMainNav } = this.props
    let updateShowNav = true

    // try to detect the user before rendering
    this.identifyCounterparty()


    if (smallScreenOrDevice) {
      this.loadListing()
      updateShowNav = false
      this.scrollToBottom()
    }

    showMainNav(updateShowNav)

    // why does the page jump ?????
    // regardless, need to scroll past the banner for now anyway
    setTimeout(() => {
      const banner = document.getElementsByClassName('warning').item(0)

      window.scrollTo(0, banner ? banner.offsetHeight : 0)
    }, 400)
  }

  componentDidUpdate(prevProps) {
    const { id, messages, users } = this.props

    // on conversation change
    if (id !== prevProps.id) {
      // immediately clear the listing/purchase context
      if (this.state.listing.id) {
        this.setState({ listing: {}, purchase: {} })
      }
      // textarea is an uncontrolled component and might maintain internal state
      (this.textarea.current || {}).value = ''
      // refresh the counterparty
      this.identifyCounterparty()
      // refresh the listing/purchase context
      this.loadListing()
    }

    // on new message
    if (messages.length > prevProps.messages.length) {
      this.loadListing()
      // auto-scroll to most recent message
      this.scrollToBottom()
    }

    // on user found
    if (users.length > prevProps.users.length) {
      this.identifyCounterparty()
    }
  }

  componentWillUnmount() {
    this.props.showMainNav(true)
  }

  handleClick() {
    this.fileInput.current.click()
  }

  handleInput(event) {
    const filesObj = event.target.files

    for (const key in filesObj) {
      if (filesObj.hasOwnProperty(key)) {
        generateCroppedImage(filesObj[key], null, (dataUri) => {
          this.setState((state) => {
            return {
              ...state,
              files: [...state.files, dataUri]
            }
          })
        })
      }
    }
  }

  handleKeyDown(e) {
    const { key, shiftKey } = e

    if (!shiftKey && key === 'Enter') {
      this.handleSubmit(e)
    }
  }

  handleSubmit(e) {
    e.preventDefault()

    const el = this.textarea.current

    if (!el) {
      // It's an image
      if (this.state.files[0].length > imageMaxSize) {
        this.form.current.reset()
        this.setState({ files: [] })
        return
      }
      return this.sendMessage(this.state.files[0])
    }

    const newMessage = el.value

    if (!newMessage.length) {
      this.setState({ invalidTextInput: true })
    } else {
      this.sendMessage(newMessage)
    }
  }

  identifyCounterparty() {
    const { fetchUser, id, users, wallet } = this.props

    if (!id) {
      return this.setState({ counterparty: {} })
    }

    const recipients = origin.messaging.getRecipients(id)
    const address = recipients.find(addr => formattedAddress(addr) !== formattedAddress(wallet.address))
    const counterparty = users.find(u => formattedAddress(u.address) === formattedAddress(address)) || { address }

    !counterparty.address && fetchUser(address)

    this.setState({ counterparty })
    this.loadPurchase()
  }

  async loadListing() {
    const { messages } = this.props
    // Find the most recent listing context or set empty value.
    const { listingId } = [...messages].reverse().find(m => m.listingId) || {}

    // If listingId does not match state, store and check for a purchase.
    if (listingId !== this.state.listing.id) {
      const listing = listingId ? await getListing(listingId, true) : {}
      this.setState({ listing })
      this.loadPurchase()
    }
  }

  async loadPurchase() {
    const { wallet } = this.props
    const { counterparty, listing, purchase } = this.state

    if (!listing.id) {
      return this.setState({ purchase: {} })
    }

    const offers = await origin.marketplace.getOffers(listing.id)
    const involvingCounterparty = offers.filter(o => {
      const buyerIsCounterparty = formattedAddress(o.buyer) === formattedAddress(counterparty.address)
      const buyerIsCurrentUser = formattedAddress(o.buyer) === formattedAddress(wallet.address)

      return buyerIsCounterparty || buyerIsCurrentUser
    })

    const sortOrder = (a, b) => (a.createdAt > b.createdAt ? -1 : 1)
    const mostRecent = involvingCounterparty.sort(sortOrder)[0]

    if (!mostRecent) {
      return this.setState({ purchase: {} })
    }

    const purchaseHasChanged = mostRecent.id !== purchase.id
    const statusHasChanged = mostRecent.status !== purchase.status

    if (purchaseHasChanged || statusHasChanged) {
      this.setState({ purchase: mostRecent })
      this.scrollToBottom()
    }
  }

  scrollToBottom() {
    const el = this.conversationDiv.current

    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }

  async sendMessage(content) {
    try {
      await origin.messaging.sendConvMessage(this.props.id, content)

      this.form.current.reset()

      if (this.state.files.length) {
        this.setState({ files: [] })
      }
    } catch (err) {
      console.error(err)
    }
  }

  formatOfferMessage(info) {
    const { listing = {} } = this.state
    const { users, intl, smallScreenOrDevice, withListingSummary } = this.props

    if (smallScreenOrDevice || !withListingSummary) return

    const { returnValues = {}, event, timestamp } = info
    const partyAddress = formattedAddress(returnValues.party)
    const user = users.find((user) => formattedAddress(user.address) === partyAddress)
    const userName = abbreviateName(user)
    const party = userName || truncateAddress(returnValues.party)

    const offerMessages = {
      'OfferCreated': `${party} ${intl.formatMessage(
        this.intlMessages.offerCreated
      )}`,
      'OfferWithdrawn': `${party} ${intl.formatMessage(
        this.intlMessages.offerWithdrawn
      )}`,
      'OfferAccepted': `${party} ${intl.formatMessage(
        this.intlMessages.offerAccepted
      )}`,
      'OfferDisputed': `${party} ${intl.formatMessage(
        this.intlMessages.offerDisputed
      )}`,
      'OfferRuling': `${party} ${intl.formatMessage(
        this.intlMessages.offerRuling
      )}`,
      'OfferFinalized': `${party} ${intl.formatMessage(
        this.intlMessages.offerFinalized
      )}`,
      'OfferData': `${party} ${intl.formatMessage(
        this.intlMessages.offerData
      )}`,
    }

    return (
      <div key={new Date() + Math.random()} className="purchase-info">
        {offerMessages[event]} {listing.name} on {formatDate(timestamp)}
      </div>
    )
  }

  render() {
    const { id, intl, messages, wallet, smallScreenOrDevice } = this.props
    const {
      counterparty,
      files,
      invalidTextInput,
      purchase
    } = this.state
    const counterpartyAddress = formattedAddress(counterparty.address)
    const canDeliverMessage =
      counterparty.address &&
      origin.messaging.canConverseWith(counterpartyAddress)
    const shouldEnableForm = id &&
      origin.messaging.getRecipients(id).includes(formattedAddress(wallet.address)) &&
      canDeliverMessage
    const offerEvents = getOfferEvents(purchase)
    const combinedMessages = [...offerEvents, ...messages]
    const textAreaSize = smallScreenOrDevice ? '8' : '4'

    return (
      <Fragment>
        <div ref={this.conversationDiv} className="conversation text-center">
          <CompactMessages
            messages={combinedMessages}
            wallet={wallet}
            formatOfferMessage={this.formatOfferMessage}
            smallScreenOrDevice={smallScreenOrDevice}
          />
        </div>
        {!shouldEnableForm && (
          <form className="add-message d-flex">
            <textarea rows={textAreaSize} tabIndex="0" disabled />
            <button type="submit" className="btn btn-sm btn-primary" disabled>
              Send
            </button>
          </form>
        )}
        {shouldEnableForm && (
          <form
            ref={this.form}
            className="add-message d-flex"
            onSubmit={this.handleSubmit}
          >
            {!files.length &&
              !invalidTextInput && (
              <textarea
                ref={this.textarea}
                placeholder={intl.formatMessage(
                  this.intlMessages.newMessagePlaceholder
                )}
                onKeyDown={this.handleKeyDown}
                tabIndex="0"
                rows={textAreaSize}
                autoFocus
              />
            )}
            {invalidTextInput && (
              <div className="files-container">
                <p
                  className="text-danger"
                  onClick={() =>
                    this.setState({
                      invalidTextInput: false
                    })
                  }
                >
                  {invalidTextInput && (
                    <FormattedMessage
                      id={'conversation.invalidTextInput'}
                      defaultMessage={'Please add a message to send.'}
                    />
                  )}
                </p>
              </div>
            )}
            {!!files.length && (
              <div className="files-container">
                {files.map((dataUri, i) => (
                  <div key={i} className="image-container">
                    <img src={dataUri} className="preview-thumbnail" />
                    <a
                      className="image-overlay-btn cancel-image"
                      aria-label="Close"
                      onClick={() => this.setState({ files: [] })}
                    >
                      <span aria-hidden="true">&times;</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
            <img
              src="images/add-photo-icon.svg"
              className="add-photo"
              role="presentation"
              onClick={this.handleClick}
            />
            <input
              type="file"
              ref={this.fileInput}
              className="d-none"
              onChange={this.handleInput}
            />
            <button type="submit" className="btn btn-sm btn-primary">
              Send
            </button>
          </form>
        )}
      </Fragment>
    )
  }
}

const mapStateToProps = ({ users, wallet, app }) => {
  return {
    users,
    wallet,
    showNav: app.showNav
  }
}

const mapDispatchToProps = dispatch => ({
  fetchUser: addr => dispatch(fetchUser(addr)),
  showMainNav: (showNav) => dispatch(showMainNav(showNav))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(Conversation))
