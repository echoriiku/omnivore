/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { DeepPartial } from 'typeorm'
import {
  Highlight as HighlightData,
  HighlightType,
} from '../../entity/highlight'
import { Label } from '../../entity/label'
import { env } from '../../env'
import {
  CreateHighlightError,
  CreateHighlightErrorCode,
  CreateHighlightSuccess,
  DeleteHighlightError,
  DeleteHighlightErrorCode,
  DeleteHighlightSuccess,
  Highlight,
  MergeHighlightError,
  MergeHighlightErrorCode,
  MergeHighlightSuccess,
  MutationCreateHighlightArgs,
  MutationDeleteHighlightArgs,
  MutationMergeHighlightArgs,
  MutationUpdateHighlightArgs,
  UpdateHighlightError,
  UpdateHighlightErrorCode,
  UpdateHighlightSuccess,
} from '../../generated/graphql'
import { highlightRepository } from '../../repository/highlight'
import {
  deleteHighlightById,
  mergeHighlights,
  saveHighlight,
} from '../../services/highlights'
import { analytics } from '../../utils/analytics'
import { authorized } from '../../utils/helpers'

const highlightDataToHighlight = (highlight: HighlightData): Highlight => ({
  ...highlight,
  replies: [],
  reactions: [],
  type: highlight.highlightType,
  createdByMe: true,
  user: {
    ...highlight.user,
    sharedArticles: [],
  },
})

export const createHighlightResolver = authorized<
  CreateHighlightSuccess,
  CreateHighlightError,
  MutationCreateHighlightArgs
>(async (_, { input }, { log, pubsub, uid }) => {
  try {
    const newHighlight = await saveHighlight(input, uid, pubsub)

    analytics.track({
      userId: uid,
      event: 'highlight_created',
      properties: {
        libraryItemId: input.articleId,
        env: env.server.apiEnv,
      },
    })

    return { highlight: highlightDataToHighlight(newHighlight) }
  } catch (err) {
    log.error('Error creating highlight', err)
    return {
      errorCodes: [CreateHighlightErrorCode.Forbidden],
    }
  }
})

export const mergeHighlightResolver = authorized<
  MergeHighlightSuccess,
  MergeHighlightError,
  MutationMergeHighlightArgs
>(async (_, { input }, { authTrx, log, pubsub, uid }) => {
  const { overlapHighlightIdList, ...newHighlightInput } = input

  /* Compute merged annotation form the order of highlights appearing on page */
  const mergedAnnotations: string[] = []
  const mergedLabels: Label[] = []

  try {
    const existingHighlights = await authTrx(async (tx) => {
      return tx
        .withRepository(highlightRepository)
        .findByLibraryItemId(input.articleId)
    })

    existingHighlights.forEach((highlight) => {
      // filter out highlights that are in the overlap list
      // and are of type highlight (not annotation or note)
      if (
        overlapHighlightIdList.includes(highlight.id) &&
        highlight.highlightType === HighlightType.Highlight
      ) {
        highlight.annotation && mergedAnnotations.push(highlight.annotation)

        if (highlight.labels) {
          // remove duplicates from labels by checking id
          highlight.labels.forEach((label) => {
            if (
              !mergedLabels.find((mergedLabel) => mergedLabel.id === label.id)
            ) {
              mergedLabels.push(label)
            }
          })
        }
      }
    })

    const highlight: DeepPartial<HighlightData> = {
      ...newHighlightInput,
      annotation:
        mergedAnnotations.length > 0 ? mergedAnnotations.join('\n') : null,
      labels: mergedLabels,
    }

    const newHighlight = await mergeHighlights(
      overlapHighlightIdList,
      highlight,
      uid,
      pubsub
    )

    analytics.track({
      userId: uid,
      event: 'highlight_created',
      properties: {
        libraryItemId: input.articleId,
        env: env.server.apiEnv,
      },
    })

    return {
      highlight: highlightDataToHighlight(newHighlight),
      overlapHighlightIdList: input.overlapHighlightIdList,
    }
  } catch (e) {
    log.error('Error merging highlight', e)
    return {
      errorCodes: [MergeHighlightErrorCode.Forbidden],
    }
  }
})

export const updateHighlightResolver = authorized<
  UpdateHighlightSuccess,
  UpdateHighlightError,
  MutationUpdateHighlightArgs
>(async (_, { input }, { pubsub, uid, log }) => {
  try {
    const updatedHighlight = await saveHighlight(input, uid, pubsub)

    return { highlight: highlightDataToHighlight(updatedHighlight) }
  } catch (error) {
    log.error('updateHighlightResolver error', error)
    return {
      errorCodes: [UpdateHighlightErrorCode.Forbidden],
    }
  }
})

export const deleteHighlightResolver = authorized<
  DeleteHighlightSuccess,
  DeleteHighlightError,
  MutationDeleteHighlightArgs
>(async (_, { highlightId }, { uid, log }) => {
  try {
    const deletedHighlight = await deleteHighlightById(highlightId, uid)

    if (!deletedHighlight) {
      return {
        errorCodes: [DeleteHighlightErrorCode.NotFound],
      }
    }

    return { highlight: highlightDataToHighlight(deletedHighlight) }
  } catch (error) {
    log.error('deleteHighlightResolver error', error)
    return {
      errorCodes: [DeleteHighlightErrorCode.Forbidden],
    }
  }
})

// export const setShareHighlightResolver = authorized<
//   SetShareHighlightSuccess,
//   SetShareHighlightError,
//   MutationSetShareHighlightArgs
// >(async (_, { input: { id, share } }, { pubsub, claims, log }) => {
//   const highlight = await getHighlightById(id)

//   if (!highlight?.id) {
//     return {
//       errorCodes: [SetShareHighlightErrorCode.NotFound],
//     }
//   }

//   if (highlight.userId !== claims.uid) {
//     return {
//       errorCodes: [SetShareHighlightErrorCode.Forbidden],
//     }
//   }

//   const sharedAt = share ? new Date() : null

//   log.info(`${share ? 'S' : 'Uns'}haring a highlight`, {
//     highlight,
//     labels: {
//       source: 'resolver',
//       resolver: 'setShareHighlightResolver',
//       userId: highlight.userId,
//     },
//   })

//   const updatedHighlight: HighlightData = {
//     ...highlight,
//     sharedAt,
//     updatedAt: new Date(),
//   }

//   const updated = await updateHighlight(updatedHighlight, {
//     pubsub,
//     uid: claims.uid,
//     refresh: true,
//   })

//   if (!updated) {
//     return {
//       errorCodes: [SetShareHighlightErrorCode.NotFound],
//     }
//   }

//   return { highlight: highlightDataToHighlight(updatedHighlight) }
// })
