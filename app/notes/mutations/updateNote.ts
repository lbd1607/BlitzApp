import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

const UpdateNote = z.object({
  id: z.number(),
  noteName: z.string(),
  noteBody: z.string(),
  itemOrder: z.number(),
  groupOrder: z.number(),
})

export default resolver.pipe(
  resolver.zod(UpdateNote),
  resolver.authorize(),
  async ({ id, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const note = await db.notes.update({ where: { id }, data })

    return note
  }
)
