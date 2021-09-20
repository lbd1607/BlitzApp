import { Fragment, Suspense, useContext, useState } from "react"
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
import { DragDropContext, Droppable, Draggable, DraggableLocation } from "react-beautiful-dnd"
import updateNote from "app/notes/mutations/updateNote"
import { FORM_ERROR } from "app/notes/components/NoteForm"
import { NotesList } from "."

//Get styles for dnd items
export const getStyle = (style, snapshot) => {
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

const [{ notes, hasMore }] = usePaginatedQuery(getNotes, {
  orderBy: { itemOrder: "asc" } || { id: "asc" },
})

//Fetch note id
export const noteId = useParam("noteId", "number")

/* export const [{ notes }] = useQuery(getNotes, { where: { id: noteId } }) */

//State for note items (each row item)
export const [noteItem, updateNoteItem] = useState(notes)

//Update mutation to update note itemOrder
export const [updateNoteMutation] = useMutation(updateNote)

var counter = noteItem.length

export async function postGroup(values, groupid) {
  try {
    const updated = await updateNoteMutation({
      group: groupid,
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

export const randid = () => {
  var i = () => {
    return ((1 + Math.random()) * 0x10000) | 0
  }
  const daygroupid = i() + i() + i() + i() + i() + i()
  return daygroupid
}

export const noteData = [
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

export const [groups, setGroups] = useState([{ groupid: randid(), idx: counter, items: noteData }])

export const addGroup = () => {
  counter + 1
  const groupid = randid()
  /* setGroups([...groups, { groupid, idx: counter, items: [] }]) */
  postGroup(setGroups([...groups, { groupid, idx: counter, items: [] }]), groupid)
}

export const deleteGroup = (groupid) => {
  const values = [...groups]
  values.splice(
    values.findIndex((value) => value.groupid === groupid),
    1
  )
  setGroups(values)
}

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

//Handle onDragEnd so state changes are persisted in UI and can be posted to DB with hooks
export const handleOnDragEnd = (result, groups, setGroups) => {
  const src = result.source
  const dest = result.destination
  if (!result.destination) return

  if (src.droppableId === dest.droppableId) {
    const items = Array.from(noteItem)
    const [removedItem] = items.splice(src.index, 1)
    items.splice(dest.index, 0, removedItem || src.index)

    if (!removedItem) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        var newOrder = items.indexOf(item)
        item.itemOrder = newOrder
      }
      postUpdatedOrder(item)
    }
    //setGroups([...groups, { [src.droppableId]: items }])

    updateNoteItem(items)
  } else {
  }
}

export const noteItems = [
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

/* 
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

      } catch (error) {
        console.error(error)
        return {
          [FORM_ERROR]: error.toString(),
        }
      }
    }
  
    async function postGroup(values, groupid) {
      try {
        const updated = await updateNoteMutation({
          group: groupid,
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
  
    //Handle onDragEnd so state changes are persisted in UI and can be posted to DB with hooks
    const handleOnDragEnd = (result, groups, setGroups) => {
      const src = result.source
      const dest = result.destination
      if (!result.destination) return
  
      if (src.droppableId === dest.droppableId) {
        const items = Array.from(noteItem)
        const [removedItem] = items.splice(src.index, 1)
        items.splice(dest.index, 0, removedItem || src.index)
  
        if (!removedItem) return
  
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item) {
            var newOrder = items.indexOf(item)
            item.itemOrder = newOrder
          }
          postUpdatedOrder(item)
        }
        //setGroups([...groups, { [src.droppableId]: items }])
  
        updateNoteItem(items)
      } else {
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
  
    const addGroup = () => {
      counter + 1
      const groupid = randid()

      postGroup(setGroups([...groups, { groupid, idx: counter, items: [] }]), groupid)
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
*/
