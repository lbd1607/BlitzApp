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

/* import {
  addGroup,
  deleteGroup,
  getStyle,
  groups,
  setGroups,
  noteData,
  noteId,
  noteItem,
  randid,
  handleOnDragEnd,
  noteItems,
} from "./utils" */

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
      items: Array.from(noteItem),
    },
    [uuid()]: {
      name: "Week 1",
      items: [],
    },
    [uuid()]: {
      name: "Week 2",
      items: [],
    },
    [uuid()]: {
      name: "Week 3",
      items: [],
    },
    [uuid()]: {
      name: "Week 4",
      items: [],
    },
  }

  const [groups, setGroups] = useState(groupList)

  //Handle onDragEnd so state changes are persisted in UI and can be posted to DB with hooks
  const handleOnDragEnd = (result, groups, setGroups) => {
    const src = result.source
    const dest = result.destination
    if (!result.destination) return

    if (src.droppableId !== dest.droppableId) {
      const srcGroup = groups[src.droppableId]
      const destGroup = groups[dest.droppableId]
      const srcItems = [...srcGroup.items]
      const destItems = [...destGroup.items]
      const [removedItem] = srcItems.splice(src.index, 1)
      destItems.splice(dest.index, 0, removedItem || src.index)
      setGroups({
        ...groups,
        [src.droppableId]: {
          ...srcGroup,
          items: srcItems,
        },
        [dest.droppableId]: {
          ...destGroup,
          items: destItems,
        },
      })

      sendOrderToSrcGroup(removedItem, srcItems, srcGroup)
      sendOrderToDestGroup(removedItem, destItems, destGroup)
      console.log(destGroup, srcItems, destItems)
    } else {
      const destGroup = groups[src.droppableId]
      const destItems = [...destGroup.items]
      const [removedItem] = destItems.splice(src.index, 1)
      destItems.splice(dest.index, 0, removedItem || src.index)
      setGroups({
        ...groups,
        [src.droppableId]: {
          ...destGroup,
          items: destItems,
        },
      })
      sendOrderToSrcGroup(removedItem, destItems, destGroup)
      console.log(destGroup, destItems)
    }
  }

  //Gather data to send the new order to postUpdatedOrder so it can be posted to the database
  const sendOrderToSrcGroup = (removedItem, newItems, newGroups) => {
    if (!removedItem) return

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]

      if (item) {
        var newOrder = newItems.indexOf(item)
        item.itemOrder = newOrder
      }
      postUpdatedOrder(item)
    }
    /*   for (let j = 0; j < newGroups.length; j++) {
      const group = newGroups[j]

      if (group) {
        var newGroupOrder = newGroups.indexOf(group)
        group.group = newGroupOrder
      }
      postUpdatedOrder(group)
    } */
    updateNoteItem(newItems)
  }
  //Gather data to send the new order to postUpdatedOrder so it can be posted to the database
  const sendOrderToDestGroup = (removedItem, newItems, newGroups) => {
    if (!removedItem) return

    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i]

      if (item) {
        var newOrder = newItems.indexOf(item)
        item.itemOrder = newOrder
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
        /*  group: group, */
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
