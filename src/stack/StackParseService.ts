import IStackParseResult from './IStackParseResult';

export default function parseStack(stackTrace:string):IStackParseResult {
    // just a stub
    return {
        callingFile: '',
        raw: stackTrace
    };
}
