import { h, Component } from '../preact'

interface IRadioInputGroupProps {
    options:{label:string, id:any}[]
    selected:any
    onRadioInputClick:(selectedId:any)=>void
}

export default function RadioInputGroup (props:IRadioInputGroupProps) {
    return (
        <div>
            {props.options.map((option) => {
                return <label key={String(option.id)}>
                    <input type="radio" checked={props.selected === option.id}
                        onClick={(evt) => {
                            if (evt.isTrusted) {
                                props.onRadioInputClick(option.id);
                            }
                        }}
                    />
                    <span>{option.label}</span>
                </label>
            })}
        </div>
    )
}
