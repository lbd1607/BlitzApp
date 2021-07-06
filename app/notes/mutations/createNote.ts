import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

const CreateNote = z.object({
  noteName: z.string(),
  noteBody: z.string(),
})

export default resolver.pipe(resolver.zod(CreateNote), resolver.authorize(), async (input) => {
  // TODO: in multi-tenant app, you must add validation to ensure correct tenant
  const note = await db.notes.create({ data: input })

  return note
})
