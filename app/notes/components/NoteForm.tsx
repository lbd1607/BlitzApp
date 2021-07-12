import { Form, FormProps } from "app/core/components/Form"
import { LabeledTextField } from "app/core/components/LabeledTextField"
import { z } from "zod"
export { FORM_ERROR } from "app/core/components/Form"
import { Field } from "react-final-form"

export function NoteForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <div className="cardcol">
        <div className="mb-3">
          <div className="input-container required-field">
            <label className="formfieldlabel ">Name</label>
            <LabeledTextField name="noteName" label="" className="inputbox " />
          </div>
          <div className="input-container">
            <label className="formfieldlabel">Note</label>
            <Field component="textarea" name="noteBody" label="" className="inputbox" />
          </div>
        </div>
      </div>
    </Form>
  )
}
