import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { momentizeGrant } from '@origin/token-transfer-server/src/lib/vesting'

import { fetchGrants } from '../../actions/grant'
import BalanceCard from '../BalanceCard'
import NewsHeadlinesCard from '../NewsHeadlinesCard'
import VestingBars from '../VestingBars'
import VestingHistory from '../VestingHistory'
import GrantDetails from '../GrantDetail'

class Dashboard extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    this.props.fetchGrants()
  }

  render() {
    return this.props.isFetching ? this.renderLoading() : this.renderDashboard()
  }

  renderLoading() {
    return 'Loading'
  }

  renderDashboard() {
    const grants = this.props.grants.map(momentizeGrant)

    const vestedTotal = grants.reduce((total, currentGrant)  => {
      return total + currentGrant.vestedAmount
    }, 0)

    console.log(vestedTotal)

    return (
      <>
        <div className="row">
          <div className="col">
            <BalanceCard balance={vestedTotal} />
          </div>
          <div className="col">
            <NewsHeadlinesCard />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <VestingBars grants={grants} />
          </div>
        </div>
        <div className="row">
          <div className="col">
            <VestingHistory grants={grants} />
          </div>
          <div className="col">
            <GrantDetails grants={grants} />
          </div>
        </div>
      </>
    )
  }
}

const mapStateToProps = ({ grant }) => {
  return {
    isFetching: grant.isFetching,
    grants: grant.grants,
    error: grant.error
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchGrants: fetchGrants
}, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard)
