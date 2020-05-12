import axios from "axios";

export function omit(obj, props) {
  props = props instanceof Array ? props : [props];
  return eval(`(({${props.join(",")}, ...o}) => o)(obj)`);
}

export function sum(obj) {
  return Object.keys(obj).reduce(
    (sum, key) => sum + parseFloat(obj[key] || 0),
    0
  );
}
