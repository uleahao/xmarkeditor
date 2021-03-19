
/**
 * Deepcopy function for TypeScript.
 * @param Tp Generic type of target/copied value.
 * @param tgt Target value to be copied.
 */
function deepcopy<Tp>(tgt: Tp): Tp {
    let cp: Tp;
    
    if (tgt === null) {
        cp = tgt;
    } else if (tgt instanceof Date) {
        cp = new Date((tgt as any).getTime()) as any;
    } else if (Array.isArray(tgt)) {
        cp = [] as any;
        (tgt as any[]).forEach((v, i, arr) => { (cp as any).push(v); });
        cp = (cp as any).map((n: any) => deepcopy<any>(n));
    } else if ((typeof(tgt) === 'object') && (tgt !== {})) {
        cp = { ...(tgt as Object) } as Tp;
        Object.keys(cp).forEach(k => {
            (cp as any)[k] = deepcopy<any>((cp as any)[k]);
        });
    } else {
        cp = tgt;
    }
    return cp;
}

/**
 * RegExps.
 * A URL must match #1 and then at least one of #2/#3.
 * Use two levels of REs to avoid REDOS.
 */

var protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;

var localhostDomainRE = /^localhost[:?\d]*(?:[^:?\d]\S*)?$/
var nonLocalhostDomainRE = /^[^\s.]+\.\S{2,}$/;

/**
 * Loosely validate a URL `string`.
 *
 * @param {String} string
 * @return {Boolean}
 */

function isUrl(string: any){
    if (typeof string !== 'string') {
        return false;
    }

    var match = string.match(protocolAndDomainRE);
    if (!match) {
        return false;
    }

    var everythingAfterProtocol = match[1];
    if (!everythingAfterProtocol) {
        return false;
    }

    if (localhostDomainRE.test(everythingAfterProtocol) ||
        nonLocalhostDomainRE.test(everythingAfterProtocol)) {
        return true;
    }

    return false;
}

export default {
    deepcopy,
    isUrl
}
