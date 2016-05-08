
export default function nonEnumKeys(object) {
    var target = object;
    var enum_and_nonenum = Object.getOwnPropertyNames(target);
    var enum_only = Object.keys(target);
    var nonenum_only = enum_and_nonenum.filter(function(key) {
        var indexInEnum = enum_only.indexOf(key);
        if (indexInEnum == -1) {
            // not found in enum_only keys mean the key is non-enumerable,
            // so return true so we keep this in the filter
            return true;
        } else {
            return false;
        }
    });

    return nonenum_only;
}
