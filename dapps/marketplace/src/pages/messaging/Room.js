import React, { Component, useEffect, useState } from 'react'
import { useQuery, useSubscription } from 'react-apollo'
// import dayjs from 'dayjs'
import get from 'lodash/get'
// import sortBy from 'lodash/sortBy'
import { fbt } from 'fbt-runtime'

import withWallet from 'hoc/withWallet'
// import withIdentity from 'hoc/withIdentity'
import withCounterpartyEvents from 'hoc/withCounterpartyEvents'

import query from 'queries/Room'
import subscription from 'queries/NewMessageSubscription'
import SendMessage from './SendMessage'
import MessageWithIdentity from './Message'
// import Link from 'components/Link'
import QueryError from 'components/QueryError'
import EnableMessaging from 'components/EnableMessaging'
// import Stages from 'components/TransactionStages'
import LoadingSpinner from 'components/LoadingSpinner'

import TopScrollListener from 'components/TopScrollListener'

// function eventName(name) {
//   if (name === 'OfferCreated') {
//     return fbt('made an offer', 'EventDescription.offerCreated')
//   } else if (name === 'OfferAccepted') {
//     return fbt('accepted an offer on', 'EventDescription.offerAccepted')
//   } else if (name === 'OfferFinalized') {
//     return fbt('finalized an offer on', 'EventDescription.offerFinalized')
//   } else if (name === 'OfferWithdrawn') {
//     return fbt('withdrew an offer on', 'EventDescription.offerWithdrawn')
//   } else if (name === 'OfferDisputed') {
//     return fbt('disputed an offer on', 'EventDescription.offerDisputed')
//   }
// }

// const OfferEvent = ({ event, wallet, identity }) => (
//   <>
//     <div className="offer-event">
//       {event.event.returnValues.party === wallet
//         ? 'You'
//         : get(identity, 'fullName')}
//       {` ${eventName(event.event.event)} `}
//       <Link to={`/purchases/${event.offer.id}`}>
//         {event.offer.listing.title}
//       </Link>
//       {` on ${dayjs.unix(event.event.timestamp).format('MMM Do, YYYY')}`}
//     </div>
//     {event.event.event !== 'OfferCreated' ? null : (
//       <Stages offer={event.offer} />
//     )}
//   </>
// )

// const OfferEventWithIdentity = withIdentity(
//   OfferEvent,
//   'event.event.returnValues.party'
// )

class AllMessages extends Component {
  state = {
    ready: false
  }

  componentDidMount() {
    this.shouldScrollToBottom()

    if (this.props.markRead) {
      this.props.markRead()
    }
  }

  componentWillUnmount() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.convId === this.props.convId) {
      return
    }

    this.shouldScrollToBottom()

    if (this.props.markRead) {
      this.props.markRead()
    }
  }

  shouldScrollToBottom() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }

    this.scrollTimeout = setTimeout(() => this.scrollToBottom(), 100)
  }

  scrollToBottom() {
    if (!this.el) {
      return
    }
    this.el.scrollTop = this.el.scrollHeight

    if (!this.state.ready) {
      this.setState({
        ready: true
      })
    }
  }

  onTopListener() {
    const { messages, fetchMore } = this.props

    if (this.state.ready && messages && messages.length && fetchMore) {
      fetchMore({
        before: messages[messages.length - 1].index
      })
    }
  }

  render() {
    // const messages = this.props.messages.map(message => ({
    //   message,
    //   timestamp: message.timestamp
    // }))
    // const events = this.props.events.map(event => ({
    //   event,
    //   timestamp: event.event.timestamp
    // }))
    // const items = sortBy([...messages, ...events], ['timestamp'])

    const { messages } = this.props

    return (
      <TopScrollListener
        onTop={() => {
          this.onTopListener()
        }}
        hasMore={this.props.hasMore}
        ready={this.state.ready}
        onInnerRef={el => (this.el = el)}
        className="messages"
      >
        <>
          {/* {this.props.eventsLoading ? (
            <div className="offer-event">Loading Events...</div>
          ) : null} */}
          {/* {items.map((item, idx) => {
            const { message, event } = item
            if (message) {
              return (
                <MessageWithIdentity
                  message={message}
                  lastMessage={idx > 0 ? messages[idx - 1] : null}
                  nextMessage={messages[idx + 1]}
                  key={`message-${message.index}`}
                  wallet={get(message, 'address')}
                  isUser={this.props.wallet === get(message, 'address')}
                />
              )
            } else if (event) {
              return (
                <OfferEventWithIdentity
                  key={`event-${idx}`}
                  event={event}
                  wallet={this.props.wallet}
                />
              )
            }
          })} */}
          {messages.map((message, idx) => {
            return (
              <MessageWithIdentity
                message={message}
                lastMessage={
                  messages.length - 1 === idx ? null : messages[idx + 1]
                }
                nextMessage={idx > 0 ? messages[idx - 1] : null}
                key={`message-${message.index}`}
                wallet={get(message, 'address')}
                isUser={this.props.wallet === get(message, 'address')}
              />
            )
          })}
        </>
      </TopScrollListener>
    )
  }
}

const Room = props => {
  const { id, wallet, markRead, enabled, counterpartyEvents } = props

  const [messages, setMessages] = useState(null)
  const [loaded, setLoaded] = useState(null)

  // Query for initial data
  const { error, data, networkStatus, fetchMore } = useQuery(query, {
    variables: { id },
    skip: !id,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only'
  })

  // Subscribe to new messages
  useSubscription(subscription, {
    onSubscriptionData: ({
      subscriptionData: {
        data: { messageAdded }
      }
    }) => {
      const { conversationId, message } = messageAdded

      if (id === conversationId) {
        setMessages([message, ...messages])
      }
    }
  })

  const isLoading = networkStatus === 1

  useEffect(() => {
    // To set `loaded` control variable to true
    // After the data has loaded for the first time
    if (loaded) {
      return
    }
    if (networkStatus === 7) {
      setLoaded(true)
      setMessages(get(data, 'messaging.conversation.messages', []))
    }
  }, [networkStatus, loaded, data])

  useEffect(() => {
    // Reset state
    setLoaded(false)
  }, [id])

  if (isLoading && !loaded) {
    return <LoadingSpinner />
  } else if (error) {
    return <QueryError query={query} error={error} />
  } else if (!isLoading && (!data || !data.messaging || !messages)) {
    return (
      <p className="p-3">
        <fbt desc="Room.cannotQuery">Cannot query messages</fbt>
      </p>
    )
  }

  const hasMore = get(data, 'messaging.conversation.hasMore', false)

  return (
    <>
      <AllMessages
        events={counterpartyEvents}
        eventsLoading={props.counterpartyEventsLoading}
        messages={messages}
        wallet={wallet}
        convId={id}
        markRead={() => markRead({ variables: { id } })}
        hasMore={hasMore}
        fetchMore={({ after, before }) => {
          fetchMore({
            variables: {
              id,
              after,
              before
            },
            updateQuery: (prevData, { fetchMoreResult }) => {
              const newMessages =
                fetchMoreResult.messaging.conversation.messages

              setMessages(newMessages)

              return prevData
            }
          })
        }}
      />
      {enabled ? (
        <SendMessage to={props.id} />
      ) : (
        <div className="col-12">
          <EnableMessaging />
        </div>
      )}
    </>
  )
}

export default withWallet(withCounterpartyEvents(Room))

require('react-styl')(`
  .messages-page .messages
    flex: 1
    overflow-y: scroll
    overflow-x: hidden
    display: flex
    flex-direction: column-reverse
    align-items: start
    .image-container
      img
        max-height: 250px
        max-width: 165px
    .timestamp
      color: var(--bluey-grey)
      font-size: 10px
      text-align: center
      align-self: center
      margin-top: 1rem
    .offer-event
      color: var(--bluey-grey)
      font-size: 18px
      font-style: italic
      align-self: center
      margin-bottom: 1rem
      font-weight: normal
    .stages
      min-height: 4rem
`)
