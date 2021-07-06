import { Fragment, Suspense, useState, useRef } from "react"
import {
  Head,
  Link,
  usePaginatedQuery,
  useRouter,
  BlitzPage,
  Routes,
  useAuthenticatedSession,
} from "blitz"
import Layout from "app/core/layouts/Layout"
import getNotes from "app/notes/queries/getNotes"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

const ITEMS_PER_PAGE = 100

export const NotesList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ notes, hasMore }] = usePaginatedQuery(getNotes, {
    orderBy: { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

  const goToPreviousPage = () => router.push({ query: { page: page - 1 } })
  const goToNextPage = () => router.push({ query: { page: page + 1 } })

  const randid = () => {
    var i = () => {
      return ((1 + Math.random()) * 0x10000) | 0
    }
    const daygroupid = i() + i() + i() + i() + i() + i()
    return daygroupid
  }
  /*  const noteObject = [{ id: randid() }]

  const rowItems = {
    [randid()]: {
      items: noteObject,
    },
  } */
  const [noteItem, updateNoteItem] = useState(notes)

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

  function handleOnDragEnd(result) {
    // console.log(result)
    if (!result.destination) return
    const items = Array.from(noteItem)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem || result)

    updateNoteItem(items)
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
              <button type="button" className="btn save">
                <Link href="/notes/new">New</Link>
              </button>
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
