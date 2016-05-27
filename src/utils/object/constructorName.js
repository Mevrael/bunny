
export default function constructorName(obj){
    if (typeof obj != "object" || obj === null) {
        return false;
    }

    let str = obj.toString();
    let start = str.indexOf(' ');
    str = str.substr(start, str.length - start - 1);

    return str;
}
