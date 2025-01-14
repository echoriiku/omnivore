import { IsNull, Not } from 'typeorm'
import { getPageById } from '../elastic/pages'
import { Reminder } from '../entity/reminder'
import { getRepository } from '../entity/utils'
import { logger } from '../utils/logger'

export interface PageReminder {
  pageId: string
  reminderId: string
  url: string
  slug: string
  title: string
  description?: string
  author?: string
  image?: string
  sendNotification?: boolean
}

export const getPagesWithReminder = async (
  userId: string,
  remindAt: Date
): Promise<PageReminder[]> => {
  const reminders = await getRepository(Reminder).findBy({
    user: { id: userId },
    status: 'CREATED',
    remindAt,
    elasticPageId: Not(IsNull()),
  })

  const results: PageReminder[] = []
  for (const reminder of reminders) {
    if (reminder.elasticPageId) {
      const page = await getPageById(reminder.elasticPageId)
      if (!page) {
        logger.info(`Reminder ${reminder.id} has invalid elasticPageId`)
        continue
      }

      results.push({
        pageId: page.id,
        reminderId: reminder.id,
        url: page.url,
        slug: page.slug,
        title: page.title,
        description: page.description,
        author: page.author,
        image: page.image,
        sendNotification: reminder.sendNotification,
      })
    }
  }

  return results
}
