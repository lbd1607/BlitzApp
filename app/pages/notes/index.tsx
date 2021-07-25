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
  generateToken,
  Router,
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
  const handleOnDragEnd = (result, groups, setGroups) => {
    if (!result.destination) return //Check if result exists

    const group = groups[result.source.id]

    if (result.source.id !== result.destination.id) {
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

      /*  setGroups([...groups, { groupid: result.destination.id }], [...group, { items: items }]) */
      setGroups([...groups, { groupid: result.destination.id, idx: counter, items: items }])

      updateNoteItem(items) //Update the selected note item to persist change in UI

      /* setGroups([...groups, { groupid: result.source.id, items: items }]) */
      //setGroups({ groupid: result.source.id, items: items })

      //Debug
      console.log(items)
      console.log(reorderedItem)
    } else {
      /*  const group = groups[result.source.id] */
      /*  const copiedItems = [...group.items] */
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

      /* setGroups([...groups, { groupid: result.destination.id }], [...group, { items: items }]) */
      setGroups([...groups, { groupid: result.destination.id, idx: counter, items: items }])

      updateNoteItem(items) //Update the selected note item to persist change in UI

      //Debug
      console.log(items)
      console.log(reorderedItem)
    }
  }

  const randid = () => {
    var i = () => {
      return ((1 + Math.random()) * 0x10000) | 0
    }
    const daygroupid = i() + i() + i() + i() + i() + i()
    return daygroupid
  }

  var counter = noteItem.length

  /*   const [groups, setGroups] = useState([{ groupid: randid(), idx: counter }]) */
  const noteData = [
    <Fragment key={randid()}>
      <ul className="">
        {noteItem.map(({ id, noteName }, index) => (
          <Draggable key={id} draggableId={id.toString()} index={index} className="" groupid={0}>
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
      </ul>
    </Fragment>,
  ]

  const [groups, setGroups] = useState([{ groupid: randid(), idx: counter, items: noteData }])

  /*   const dataObjects = () => {
    var first = setGroups([...groups, { groupid: randid(), idx: counter, items: noteData }])

    var subsequent = setGroups([...groups, { groupid: randid(), idx: counter, items: [] }])
  } */

  const addGroup = () => {
    counter + 1
    // setGroups([...groups, { groupid: randid(), idx: counter }])
    setGroups([...groups, { groupid: randid(), idx: counter, items: [] }])
  }

  const deleteGroup = (groupid) => {
    const values = [...groups]
    values.splice(
      values.findIndex((value) => value.groupid === groupid),
      1
    )
    setGroups(values)
  }

  //Get styles for dnd items
  const getStyle = (style, snapshot) => {
    if (!snapshot.isDropAnimating) {
      return style
    }
    const { moveTo, curve, duration } = snapshot.dropAnimation

    const translate = `translate(${moveTo.x}px, ${moveTo.y}px)`

    return {
      ...style,
      transform: `${translate}`,
      transition: `all ${curve} ${duration + 0.5}s`,

      background: "rgba(209, 250, 229)",
    }
  }

  const noteItems = [
    <Fragment key={randid()}>
      <ul className="">
        {noteItem.map(({ id, noteName }, index) => (
          <Draggable key={id} draggableId={id.toString()} index={index} className="" groupid={0}>
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
      </ul>
    </Fragment>,
  ]

  return (
    <>
      <DragDropContext onDragEnd={(result) => handleOnDragEnd(result, groups, setGroups)}>
        {Object.entries(groups).map(([groupid, group], index) => {
          return (
            <Fragment key={groupid}>
              <Droppable droppableId={groupid}>
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <>
                      <div className="cardcol mb-3">
                        <div
                          style={{
                            background: snapshot.isDraggingOver ? "lightblue" : "lightgrey",
                          }}
                          className="bg-blue-200 p-5"
                        >
                          {group.items.map((item, index) => {
                            return <Fragment key={randid()}>{noteItems}</Fragment>
                          })}
                        </div>
                        <div className="mt-5">
                          <button onClick={addGroup} className="col-span-1 btn save">
                            Add Group
                          </button>
                          <button
                            className="col-span-1 btn cancel"
                            /* disabled={groups.length === 1} */
                            onClick={() => deleteGroup(groupid)}
                            type="button"
                          >
                            Delete Group
                          </button>
                        </div>
                      </div>
                    </>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Fragment>
          )
        })}
      </DragDropContext>
    </>
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
            <div className="inner-scroll-heading grid grid-cols-12">
              <h1 className="col-span-1">Notes</h1>
              <div className="col-span-1">
                <Fragment>
                  <Link href="/notes/new">
                    <button type="button" className="btn save">
                      Add Note
                    </button>
                  </Link>
                </Fragment>
              </div>
            </div>
            <div className="inner-scroll">
              <div className="">
                <Suspense fallback={<div>Loading...</div>}>
                  <NotesList />
                </Suspense>
              </div>
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
