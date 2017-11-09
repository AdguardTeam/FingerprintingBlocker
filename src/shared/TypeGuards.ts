export default class TypeGuards {
    static isUndef = (obj:any):obj is undefined => {
        return typeof obj === 'undefined';
    }
}
