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
import getNote from "app/notes/queries/getNote"
import { DragDropContext, Droppable, Draggable, DraggableLocation } from "react-beautiful-dnd"
import updateNote from "app/notes/mutations/updateNote"
import { FORM_ERROR } from "app/notes/components/NoteForm"
import { v4 as uuid } from "uuid"

const ITEMS_PER_PAGE = 100

export const NotesList = () => {
  const router = useRouter()
  const page = Number(router.query.page) || 0
  const [{ notes, hasMore }] = usePaginatedQuery(getNotes, {
    orderBy: { itemOrder: "asc" } || { id: "asc" },
    skip: ITEMS_PER_PAGE * page,
    take: ITEMS_PER_PAGE,
  })

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

  //State for note items (each row item)
  const [noteItem, updateNoteItem] = useState(notes)

  //Fetch note id
  const noteId = useParam("noteId", "number")

  //Create list of premade groups
  const groupList = {
    [uuid()]: {
      name: "Unassigned",
      items: Array.from(
        noteItem.filter((noteItem) => noteItem.groupOrder === null || noteItem.groupOrder === 0)
      ),
      groupOrder: 0,
    },
    [uuid()]: {
      name: "Week 1",
      items: Array.from(noteItem.filter((noteItem) => noteItem.groupOrder === 1)),
      groupOrder: 1,
    },
    [uuid()]: {
      name: "Week 2",
      items: Array.from(noteItem.filter((noteItem) => noteItem.groupOrder === 2)),
      groupOrder: 2,
    },
    [uuid()]: {
      name: "Week 3",
      items: Array.from(noteItem.filter((noteItem) => noteItem.groupOrder === 3)),
      groupOrder: 3,
    },
    [uuid()]: {
      name: "Week 4",
      items: Array.from(noteItem.filter((noteItem) => noteItem.groupOrder === 4)),
      groupOrder: 4,
    },
  }

  const [groups, setGroups] = useState(groupList)

  //Handle onDragEnd so state changes are persisted in UI and can be posted to DB with hooks
  const handleOnDragEnd = (result, groups, setGroups) => {
    const start = result.source
    const end = result.destination
    const startId = start.droppableId
    const endId = end.droppableId
    //If dropped outside the droppable area, return (ignores move)
    if (!end) return

    if (startId === endId) {
      const endGroup = groups[startId]
      const endItems = [...endGroup.items]
      const [removedItem] = endItems.splice(start.index, 1)
      endItems.splice(end.index, 0, removedItem || start.index)
      //Update state of start group only
      setGroups({
        ...groups,
        [startId]: {
          ...endGroup,
          items: endItems,
        },
      })
      gatherItemOrder(removedItem, endItems, endGroup)
    } else {
      const startGroup = groups[startId]
      const startItems = [...startGroup.items]
      const [removedItem] = startItems.splice(start.index, 1)
      const endGroup = groups[endId]
      const endItems = [...endGroup.items]
      endItems.splice(end.index, 0, removedItem || start.index)
      //Update state of start and end groups
      setGroups({
        ...groups,
        [startId]: {
          ...startGroup,
          items: startItems,
        },
        [endId]: {
          ...endGroup,
          items: endItems,
        },
      })
      gatherItemOrder(removedItem, endItems, endGroup)
      // gatherGroupOrder(removedItem, endGroup)
    }
  }

  //Gather data to send the new order to postUpdatedOrder so it can be posted to the database
  const gatherItemOrder = (removedItem, newItems, newGroups) => {
    if (!removedItem) return

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]

      if (item) {
        var newOrder = newItems.indexOf(item)
        item.itemOrder = newOrder
        item.groupOrder = newGroups.groupOrder
      }

      postUpdatedOrder(item)
    }
    updateNoteItem(newItems)
  }

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
    } catch (error) {
      console.error(error)
      return {
        [FORM_ERROR]: error.toString(),
      }
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={(result) => handleOnDragEnd(result, groups, setGroups)}>
        {Object.entries(groups).map(([groupid, group], index) => {
          return (
            <Fragment key={groupid}>
              <Droppable droppableId={groupid}>
                {(provided, snapshot) => {
                  return (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <>
                        <div className="cardcol mb-3">
                          <div
                            style={{
                              background: snapshot.isDraggingOver ? "lightblue" : "lightgrey",
                            }}
                            className="bg-blue-200 px-5 pt-5 pb-16"
                          >
                            <h2>{group.name}</h2>
                            {group.items.map((item, index) => {
                              return (
                                <Draggable
                                  key={item.id}
                                  draggableId={item.id.toString()}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <Link href={Routes.ShowNotePage({ noteId: item.id })}>
                                      <ul className="">
                                        <li
                                          className="itemrow"
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          ref={provided.innerRef}
                                          style={getStyle(provided.draggableProps.style, snapshot)}
                                        >
                                          <a className="select-none">{item.noteName}</a>
                                        </li>
                                      </ul>
                                    </Link>
                                  )}
                                </Draggable>
                              )
                            })}
                          </div>
                        </div>
                      </>
                      {provided.placeholder}
                    </div>
                  )
                }}
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
