// Define the type of the body for the Search request
import { PubsubClient } from '../datalayer/pubsub'
import { PickTuple } from '../util'
import {
  DateFilter,
  FieldFilter,
  HasFilter,
  InFilter,
  LabelFilter,
  NoFilter,
  ReadFilter,
  SortParams,
} from '../utils/search'

// Complete definition of the Search response
export interface ShardsResponse {
  total: number
  successful: number
  failed: number
  skipped: number
}

export interface Explanation {
  value: number
  description: string
  details: Explanation[]
}

export interface SearchResponse<T> {
  took: number
  timed_out: boolean
  _scroll_id?: string
  _shards: ShardsResponse
  hits: {
    total: {
      value: number
    }
    max_score: number
    hits: Array<{
      _index: string
      _type: string
      _id: string
      _score: number
      _source: T
      _version?: number
      _explanation?: Explanation
      fields?: never
      highlight?: never
      inner_hits?: unknown
      matched_queries?: string[]
      sort?: string[]
    }>
  }
  aggregations?: never
}

export enum PageType {
  Article = 'ARTICLE',
  Book = 'BOOK',
  File = 'FILE',
  Profile = 'PROFILE',
  Unknown = 'UNKNOWN',
  Website = 'WEBSITE',
  Highlights = 'HIGHLIGHTS',
  Tweet = 'TWEET',
  Video = 'VIDEO',
  Image = 'IMAGE',
}

export enum ArticleSavingRequestStatus {
  Failed = 'FAILED',
  Processing = 'PROCESSING',
  Succeeded = 'SUCCEEDED',
  Deleted = 'DELETED',

  Archived = 'ARCHIVED',
}

export enum HighlightType {
  Highlight = 'HIGHLIGHT',
  Redaction = 'REDACTION', // allowing people to remove text from the page
  Note = 'NOTE', // allowing people to add a note at the document level
}

export interface Label {
  id: string
  name: string
  color: string
  description?: string | null
  createdAt?: Date
}

export interface Highlight {
  id: string
  shortId: string
  patch?: string | null
  quote?: string | null
  userId: string
  createdAt: Date
  prefix?: string | null
  suffix?: string | null
  annotation?: string | null
  sharedAt?: Date | null
  updatedAt: Date
  labels?: Label[]
  highlightPositionPercent?: number | null
  highlightPositionAnchorIndex?: number | null
  type: HighlightType
  html?: string | null
}

export interface RecommendingUser {
  userId: string
  name: string
  username: string
  profileImageURL?: string | null
}

export interface Recommendation {
  id: string
  name: string
  note?: string | null
  user: RecommendingUser
  recommendedAt: Date
}

export interface Page {
  id: string
  userId: string
  title: string
  author?: string
  description?: string
  content: string
  url: string
  hash: string
  uploadFileId?: string | null
  image?: string
  pageType: PageType
  originalHtml?: string | null
  slug: string
  labels?: Label[]
  readingProgressTopPercent?: number
  readingProgressPercent: number
  readingProgressAnchorIndex: number
  createdAt: Date
  updatedAt?: Date
  publishedAt?: Date
  savedAt: Date
  sharedAt?: Date
  archivedAt?: Date | null
  siteName?: string
  _id?: string
  siteIcon?: string
  highlights?: Highlight[]
  subscription?: string
  unsubMailTo?: string
  unsubHttpUrl?: string
  state: ArticleSavingRequestStatus
  taskName?: string
  language?: string
  readAt?: Date
  listenedAt?: Date
  wordsCount?: number
  recommendations?: Recommendation[]
  rssFeedUrl?: string
}

export interface SearchItem {
  annotation?: string | null
  author?: string | null
  createdAt: Date
  description?: string | null
  id: string
  image?: string | null
  pageId?: string
  pageType: PageType
  publishedAt?: Date
  quote?: string | null
  shortId?: string | null
  slug: string
  title: string
  uploadFileId?: string | null
  url: string
  archivedAt?: Date | null
  readingProgressTopPercent?: number
  readingProgressPercent: number
  readingProgressAnchorIndex: number
  userId: string
  state?: ArticleSavingRequestStatus
  language?: string
  readAt?: Date
  savedAt: Date
  updatedAt?: Date
  labels?: Label[]
  highlights?: Highlight[]
  wordsCount?: number
  siteName?: string
  siteIcon?: string
  recommendations?: Recommendation[]
  content?: string
}

const keys = ['_id', 'url', 'slug', 'userId', 'uploadFileId', 'state'] as const

export type ParamSet = PickTuple<Page, typeof keys>

export interface PageContext {
  pubsub: PubsubClient
  refresh?: boolean
  uid: string
  shouldPublish?: boolean
}

export interface PageSearchArgs {
  from?: number
  size?: number
  sort?: SortParams
  query?: string
  inFilter?: InFilter
  readFilter?: ReadFilter
  typeFilter?: PageType
  labelFilters?: LabelFilter[]
  hasFilters?: HasFilter[]
  dateFilters?: DateFilter[]
  termFilters?: FieldFilter[]
  matchFilters?: FieldFilter[]
  includePending?: boolean | null
  includeDeleted?: boolean
  ids?: string[]
  recommendedBy?: string
  includeContent?: boolean
  noFilters?: NoFilter[]
  siteName?: string
}
