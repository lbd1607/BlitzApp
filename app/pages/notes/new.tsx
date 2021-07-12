import { Link, useRouter, useMutation, BlitzPage, Routes } from "blitz"
import Layout from "app/core/layouts/Layout"
import createNote from "app/notes/mutations/createNote"
import { NoteForm, FORM_ERROR } from "app/notes/components/NoteForm"
import { Suspense } from "react"

const NewNotePage: BlitzPage = () => {
  const router = useRouter()
  const [createNoteMutation] = useMutation(createNote)

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex">
        <div className="card-container">
          <div className="modal-card">
            <div className="cardcol">
              <div className="grid grid-cols-8">
                <h1 className="mb-5 col-span-7">Create New Note</h1>
              </div>

              <NoteForm
                submitText="Save"
                cancelText="Cancel"
                cancelURL="/notes"
                // TODO use a zod schema for form validation
                //  - Tip: extract mutation's schema into a shared `validations.ts` file and
                //         then import and use it here
                // schema={CreateNote}
                // initialValues={{}}
                onSubmit={async (values) => {
                  try {
                    const note = await createNoteMutation(values)
                    router.push(Routes.ShowNotePage({ noteId: note.id }))
                  } catch (error) {
                    //console.error(error)
                    if (!values.noteName) {
                      return { [FORM_ERROR]: "Enter a name for the note." }
                    } else if (!values.noteBody) {
                      return { [FORM_ERROR]: "Enter a note." }
                    } else {
                      return {
                        [FORM_ERROR]: error.toString(),
                      }
                    }
                  }
                }}
                onCancel={async () => {
                  try {
                    router.back()
                  } catch (error) {
                    console.error(error)
                    return {
                      [FORM_ERROR]: error.toString(),
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}

NewNotePage.authenticate = true
NewNotePage.getLayout = (page) => <Layout title={"Create New Note"}>{page}</Layout>

export default NewNotePage
