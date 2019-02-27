const Common = require('./Common')

module.exports =
  Object.values(Common).reduce((acc, item) => acc + item) +
  `
  scalar JSON
  scalar DateTime

  ###############################################
  #
  # Query output schema for Growth Apollo server.
  #
  ###############################################

  enum GrowthCampaignStatus {
    Pending                   #not yet started
    Active
    CapReached
    Completed
  }

  enum GrowthActionStatus {
    Inactive
    Active
    Exhausted
    Completed
  }

  enum GrowthActionType {
    Email
    Phone
    Twitter
    Airbnb
    Facebook
    Referral
    Profile
    ListingCreated
    ListingPurchased
  }

  enum GrowthInviteStatus {
    Pending
    Successful
  }

  enum Eligibility {
    Unknown
    Eligible
    Restricted
    Forbidden
  }

  type Invite {
    status: GrowthInviteStatus!
    walletAddress: ID!
    contactName: String
    reward: Price
  }

  type InviteInfo {
    firstName: String
    lastName: String
  }

  type UnlockCondition {
    messageKey: String!
    iconSource: String!
  }

  interface GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: Price
    reward: Price            # information about reward
    unlockConditions: [UnlockCondition]
  }

  type GrowthAction implements GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: Price
    reward: Price            # information about reward
    unlockConditions: [UnlockCondition]
  }

  type GrowthInviteConnection {
    nodes: [Invite]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ReferralAction implements GrowthBaseAction {
    type: GrowthActionType!
    status: GrowthActionStatus!
    rewardEarned: Price
    rewardPending: Price
    reward: Price            # information about reward
    # first property specifies the number of items to return
    # after is the cursor
    invites(first: Int, after: String): [GrowthInviteConnection]
    unlockConditions: [UnlockCondition]
  }

  type GrowthCampaign {
    id: Int!
    nameKey: String!
    shortNameKey: String!
    startDate: DateTime
    endDate: DateTime
    distributionDate: DateTime
    status: GrowthCampaignStatus!
    actions: [GrowthBaseAction]
    rewardEarned: Price      # amount earned all actions combined
  }

  type GrowthCampaignConnection {
    nodes: [GrowthCampaign]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EligibilityInfo {
    eligibility: Eligibility
    countryName: String
    countryCode: String
  }

  type Query {
    # first property specifies the number of items to return
    # after is the cursor
    campaigns(first: Int, after: String, walletAddress: ID!): GrowthCampaignConnection
    campaign(id: String, walletAddress: ID!): GrowthCampaign
    inviteInfo(code: String): InviteInfo
    isEligible: EligibilityInfo
  }

  type Mutation {
    # Sends email invites with referral code on behalf of the referrer.
    invite(walletAddress: ID!, emails: [String!]!): Boolean
    # Enrolls user into the growth engine program.
    enroll(campaignId: Int!, notResidentCertification: Boolean): Boolean
    invited(walletAddress: ID!, inviteCode: String!): Boolean
    # Records a growth engine event.
    log(event: JSON!): Boolean
  }
`
