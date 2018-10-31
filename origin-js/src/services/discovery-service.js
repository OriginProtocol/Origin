// Request at most 100 results from the back-end.
const MAX_NUM_RESULTS = 100

class DiscoveryService {
  constructor({ discoveryServerUrl, fetch }) {
    this.discoveryServerUrl = discoveryServerUrl
    this.fetch = fetch
  }

  /**
   * Helper method. Calls discovery server and returns response.
   * @param graphQlQuery
   * @return {Promise<*>}
   * @private
   */
  async _query(graphQlQuery) {
    const resp = await this.fetch(
      this.discoveryServerUrl,
      {
        method: 'POST',
        body: JSON.stringify({
          query: graphQlQuery
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      },
      function(error) {
        if (error !== undefined)
          throw Error(
            `An error occurred when reaching discovery server: ${error}`
          )
      }
    )

    if (resp.status !== 200) {
      //TODO: also report error message here
      throw Error(
        `Discovery server returned unexpected status code ${
          resp.status
        } with error `
      )
    }
    return await resp.json()
  }

  /**
   * Issues a search request against the discovery server.
   * @param searchQuery {string} general search query
   * @param filters {object} object with properties: name, value, valueType, operator
   * @returns {Promise<list(Objects)>}
   */
  async search(searchQuery, numberOfItems, offset, filters = []) {
    // from page should be bigger than 0
    offset = Math.max(offset, 0)
    // clamp numberOfItems between 1 and 12
    numberOfItems = Math.min(Math.max(numberOfItems, 1), 100)
    const query = `
    {
      listings (
        searchQuery: "${searchQuery}"
        filters: [${filters
    .map(filter => {
      return `
    {
      name: "${filter.name}"
      value: "${String(filter.value)}"
      valueType: ${filter.valueType}
      operator: ${filter.operator}
    }
    `
    })
    .join(',')}]
        page:{
          offset: ${offset}
          numberOfItems: ${numberOfItems}
        }
      ) {
        nodes {
          id
        }
        offset
        numberOfItems
        totalNumberOfItems
        stats {
          maxPrice
          minPrice
        }
      }
    }`

    return this._query(query)
  }

  /**
   * Queries discovery server for all listings, with support for pagination.
   * @param opts: { idsOnly, listingsFor, purchasesFor, offset, numberOfItems }
   * @return {Promise<*>}
   */
  async getListings(opts) {
    // Offset should be bigger than 0.
    const offset = Math.max(opts.offset || 0, 0)

    // For numberOfItems, any value between 1 and MAX_NUM_RESULTS is valid.
    // Temporarily, while switching DApp to fetch data from back-end, we use -1 as
    // a special value for requesting all listings. This will get deprecated in the future.
    const numberOfItems = opts.numberOfItems
      ? Math.min(Math.max(opts.numberOfItems, 1), MAX_NUM_RESULTS)
      : -1

    // TODO: pass listingsFor, purchasesFor as filters
    const query = `{
      listings(
        filters: []
        page: { offset: ${offset}, numberOfItems: ${numberOfItems}}
      ) {
        nodes {
          id
          data
        }
      }
    }`

    const resp = await this._query(query)
    if (opts.idsOnly) {
      return resp.data.listings.nodes.map(listing => listing.id)
    } else {
      return resp.data.listings.nodes.map(listing => listing.data)
    }
  }

  /**
   * Queries discovery server for a listing based on its id.
   * @param listingId
   * @return {Promise<*>}
   */
  async getListing(listingId) {
    const query = `{
      listing(id: "${listingId}") {
        id
        data
      }
    }`
    const resp = await this._query(query)
    return resp.data.listing.data
  }
}

export default DiscoveryService
