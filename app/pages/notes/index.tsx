import { Fragment, Suspense, useState } from "react"
import {
  Head,
  Link,
  usePaginatedQuery,
  useRouter,
  BlitzPage,
  Routes,
  useMutation,
  useParam,
  useQuery,
} from "blitz"
import Layout from "app/core/layouts/Layout"
import getNotes from "app/notes/queries/getNotes"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import updateNote from "app/notes/mutations/updateNote"
import { FORM_ERROR } from "app/notes/components/NoteForm"

const ITEMS_PER_PAGE = 100

export const NotesList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ notes, hasMore }] = usePaginatedQuery(getNotes, {
    orderBy: { itemOrder: "asc" } || { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })
  //State for note items (each row item)
  const [noteItem, updateNoteItem] = useState(notes)

  //Get styles for dnd items
  function getStyle(style, snapshot) {
    if (!snapshot.isDropAnimating) {
      return style
    }
    const { moveTo, curve, duration } = snapshot.dropAnimation

    const translate = `translate(${moveTo.x}px, ${moveTo.y}px)`

    return {
      ...style,
      transform: `${translate}`,
      transition: `all ${curve} ${duration + 0.5}s`,
      // background: "rgba(209, 250, 229)",
    }
  }
  //Fetch note id
  const noteId = useParam("noteId", "number")

  //Update mutation to update note itemOrder
  const [updateNoteMutation] = useMutation(updateNote)

  //Post updated itemOrder values to the noteItem passed in from handleOnDragEnd()
  async function postUpdatedOrder(values) {
    try {
      const updated = await updateNoteMutation({
        id: noteId,
        ...values,
      })
      await updated
      /*  await setQueryData(updated)
        router.push(Routes.ShowNotePage({ noteId: updated.id })) */
    } catch (error) {
      console.error(error)
      return {
        [FORM_ERROR]: error.toString(),
      }
    }
  }

  //Handle onDragEnd so state changes are persisted in UI and can be posted to DB with hooks
  function handleOnDragEnd(result) {
    if (!result.destination) return //Check if result exists

    const items = Array.from(noteItem) //Create array 'items' out of noteItem
    const [reorderedItem] = items.splice(result.source.index, 1) //Splice result source values
    items.splice(result.destination.index, 0, reorderedItem || result.source.index) //Splice result destination values

    if (!reorderedItem) return //Check if reorderedItem exists

    //For each item in the items array, assign the new indexes as the item orders and post to the database using an async function and the existing updateNotes mutation
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        var newOrder = items.indexOf(item)
        item.itemOrder = newOrder
      }
      postUpdatedOrder(item)
    }

    updateNoteItem(items) //Update the selected note item to persist change in UI

    //Debug
    console.log(items)
    console.log(reorderedItem)
  }

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Droppable droppableId="notes">
        {(provided, snapshot) => (
          <ul {...provided.droppableProps} ref={provided.innerRef}>
            {noteItem.map(({ id, noteName }, index) => (
              <Draggable key={id} draggableId={id.toString()} index={index} className="">
                {(provided, snapshot) => (
                  <Link href={Routes.ShowNotePage({ noteId: id })}>
                    <li
                      className="itemrow"
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      style={getStyle(provided.draggableProps.style, snapshot)}
                    >
                      <a className="select-none">{noteName}</a>
                    </li>
                  </Link>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  )
}

const NotesPage: BlitzPage = () => {
  return (
    <>
      <Head>
        <title>Notes</title>
      </Head>

      <div className="card-container-parent">
        <div className="list-card">
          <div className="inner-scroll-parent">
            <div className="inner-scroll-heading">
              <h1>Notes</h1>
            </div>
            <div className="inner-scroll">
              <div className="">
                <Suspense fallback={<div>Loading...</div>}>
                  <NotesList />
                </Suspense>
              </div>
              <Fragment>
                <Link href="/notes/new">
                  <button type="button" className="btn save">
                    New
                  </button>
                </Link>
              </Fragment>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

NotesPage.authenticate = true
NotesPage.getLayout = (page) => <Layout>{page}</Layout>

export default NotesPage
