import TypeGuards from '../../shared/TypeGuards'

const h = preact.h;
const Component = preact.Component;

interface ISelectProps {
    initialValue:string
    onChange:(value:string)=>void
    options:string[]
    // calculates the confidence of a given option against a provided input
    calculateConfidence:(given:string, against:string)=>number
    confidenceThreshold:number
    getCreateMessage(input:string):string
}

interface ISelectState {
    inputValue:string
    currentOptions:string[]
    optionIsOpened:boolean
}

interface OptionConfidence {
    index:number
    confidence:number // Higher is better
}

const reHostname = new RegExp("^"
    + "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)"
    + "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*"
    + "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))"
    + "\\.?"
    + "$", "i");

/**
 * User actions that affects states:
 *  - clicking on the input box
 *    - open options
 *  - losing focus of the input box:
 *    - close options
 *  - clicking on the arrow
 *    - open options
 *  - clicking on an input option:
 *    - set inputValue to the selected option's value
 *    - close the options
 *  - clicking on an option to create a new option:
 *    - set inputValue to the seleced option's value
 */

export default class Select extends Component<ISelectProps, ISelectState> {
    constructor(props:ISelectProps) {
        super(props);
        this.state = {
            inputValue: props.initialValue,
            currentOptions: props.options.slice(),
            optionIsOpened: false
        };
        this.onOptionClick = this.onOptionClick.bind(this);
        this.onInputClick = this.onInputClick.bind(this);
        this.onArrowClick = this.onArrowClick.bind(this);
        this.onInputBlur = this.onInputBlur.bind(this);
    }
    private onOptionClick(evt:MouseEvent) {
        let target = evt.target;
        if (!TypeGuards.isHTMLElement(target)) { return; }
        let value = target.getAttribute('data-value');
        this.onOptionSelect(value);
    }
    private onOptionSelect(value:string) {
        const state = this.state;
        let inputValue:string;
        if (value === 'create') {
            // Create new option entry
            inputValue = state.inputValue;
            const prevOptions = state.currentOptions;
            this.setState({
                inputValue,
                currentOptions: [inputValue, ...prevOptions],
                optionIsOpened: false
            });
        } else {
            inputValue = value;
            this.setState({
                inputValue,
                optionIsOpened: false
            });
        }
        this.props.onChange(inputValue);
    }
    private getMatchingOptions():string[] {
        const state = this.state;
        const currentOptions = state.currentOptions
        const inputValue = state.inputValue;
        if (inputValue.length === 0) { return currentOptions; }
        const props = this.props;
        let confArr:OptionConfidence[] = [];
        let i = 0, l = currentOptions.length;
        for (; i < l; i++) {
            confArr.push({
                index: i,
                confidence: props.calculateConfidence(currentOptions[i], inputValue)
            });
        }
        confArr = confArr.sort((a, b) => {
            return b.confidence - a.confidence
        });
        for (i = 0; i < l; i++) {
            if (confArr[i].confidence < props.confidenceThreshold) {
                break;
            }
        }
        l = i;
        confArr.splice(i, l);
        let result:string[] = [];
        for (i = 0; i < l; i++) {
            result.push(currentOptions[confArr[i].index]);
        }
        return result;
    }
    private onInputChange(value:string) {
        this.setState({
            inputValue: value,
        });
    }
    private onInputClick() {
        this.setState({
            optionIsOpened: true
        })
    }
    private onArrowClick() {
        this.setState({
            optionIsOpened: !this.state.optionIsOpened
        })
    }
    private onInputBlur() {
        if (this.state.currentOptions.indexOf(this.state.inputValue) !== -1) {
            this.setState({
                optionIsOpened: false
            })
        }
    }
    render(props:ISelectProps, state:ISelectState) {
        const inputValue = state.inputValue;
        const shouldOfferCreatingOption = state.currentOptions.indexOf(inputValue) === -1 && reHostname.test(inputValue);
        return (
            <div class="select__root">
                <div class="select__input-wrap">
                    <input type="text" class="select__input" value={state.inputValue}
                        onKeyUp={(evt) => {
                            this.onInputChange((evt.currentTarget as HTMLInputElement).value);
                        }}
                        onClick={this.onInputClick}
                        onBlur={this.onInputBlur}
                    />
                    <div class="select__arrow" onClick={this.onArrowClick}></div>
                </div>
                {
                    state.optionIsOpened && <div class="select__options-root" onClick={this.onOptionClick}>
                        {
                            shouldOfferCreatingOption ? <div class="select__option select__option-create" key={''} data-value="create">
                                {props.getCreateMessage(inputValue)}
                            </div> : null
                        }
                        {
                            this.getMatchingOptions().map((option, index) => {
                                return (
                                    <div class="select__option" key={option} data-value={option}>
                                        {option}
                                    </div>
                                );
                            })
                        }
                    </div>
                }
            </div>
        )
    }
}
