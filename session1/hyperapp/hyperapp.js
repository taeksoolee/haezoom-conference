var hyperapp = (function () {
  var SSR_NODE = 1
    , TEXT_NODE = 3
    , EMPTY_OBJ = {}
    , EMPTY_ARR = []
    , SVG_NS = "http://www.w3.org/2000/svg"
    , id = e=>e
    , map = EMPTY_ARR.map
    , isArray = Array.isArray
    , enqueue = "undefined" != typeof requestAnimationFrame ? requestAnimationFrame : setTimeout
    , createClass = e=>{
      var r = "";
      if ("string" == typeof e)
          return e;
      if (isArray(e))
          for (var t, o = 0; o < e.length; o++)
              (t = createClass(e[o])) && (r += (r && " ") + t);
      else
          for (var o in e)
              e[o] && (r += (r && " ") + o);
      return r
  }
    , shouldRestart = (e,r)=>{
      for (var t in {
          ...e,
          ...r
      })
          if ("function" == typeof (isArray(e[t]) ? e[t][0] : e[t]))
              r[t] = e[t];
          else if (e[t] !== r[t])
              return !0
  }
    , patchSubs = (e,r=EMPTY_ARR,t)=>{
      for (var o, n, a = [], l = 0; l < e.length || l < r.length; l++)
          o = e[l],
          a.push((n = r[l]) && !0 !== n ? !o || n[0] !== o[0] || shouldRestart(n[1], o[1]) ? [n[0], n[1], (o && o[2](),
          n[0](t, n[1])), ] : o : o && o[2]());
      return a
  }
    , getKey = e=>null == e ? e : e.key
    , patchProperty = (e,r,t,o,n,a)=>{
      if ("style" === r)
          for (var l in {
              ...t,
              ...o
          })
              t = null == o || null == o[l] ? "" : o[l],
              "-" === l[0] ? e[r].setProperty(l, t) : e[r][l] = t;
      else
          "o" === r[0] && "n" === r[1] ? ((e.events || (e.events = {}))[r = r.slice(2)] = o) ? t || e.addEventListener(r, n) : e.removeEventListener(r, n) : !a && "list" !== r && "form" !== r && r in e ? e[r] = null == o ? "" : o : null == o || !1 === o ? e.removeAttribute(r) : e.setAttribute(r, o)
  }
    , createNode = (e,r,t)=>{
      var o = e.props
        , n = e.type === TEXT_NODE ? document.createTextNode(e.tag) : (t = t || "svg" === e.tag) ? document.createElementNS(SVG_NS, e.tag, o.is && o) : document.createElement(e.tag, o.is && o);
      for (var a in o)
          patchProperty(n, a, null, o[a], r, t);
      for (var l = 0; l < e.children.length; l++)
          n.appendChild(createNode(e.children[l] = maybeVNode(e.children[l]), r, t));
      return e.node = n
  }
    , patch = (e,r,t,o,n,a)=>{
      if (t === o)
          ;
      else if (null != t && t.type === TEXT_NODE && o.type === TEXT_NODE)
          t.tag !== o.tag && (r.nodeValue = o.tag);
      else if (null == t || t.tag !== o.tag)
          r = e.insertBefore(createNode(o = maybeVNode(o), n, a), r),
          null != t && e.removeChild(t.node);
      else {
          var l, d, i, s, p = t.props, c = o.props, u = t.children, f = o.children, y = 0, v = 0, m = u.length - 1, g = f.length - 1;
          for (var N in a = a || "svg" === o.tag,
          {
              ...p,
              ...c
          })
              ("value" === N || "selected" === N || "checked" === N ? r[N] : p[N]) !== c[N] && patchProperty(r, N, p[N], c[N], n, a);
          for (; v <= g && y <= m && null != (i = getKey(u[y])) && i === getKey(f[v]); )
              patch(r, u[y].node, u[y], f[v] = maybeVNode(f[v++], u[y++]), n, a);
          for (; v <= g && y <= m && null != (i = getKey(u[m])) && i === getKey(f[g]); )
              patch(r, u[m].node, u[m], f[g] = maybeVNode(f[g--], u[m--]), n, a);
          if (y > m)
              for (; v <= g; )
                  r.insertBefore(createNode(f[v] = maybeVNode(f[v++]), n, a), (d = u[y]) && d.node);
          else if (v > g)
              for (; y <= m; )
                  r.removeChild(u[y++].node);
          else {
              for (var E = {}, $ = {}, N = y; N <= m; N++)
                  null != (i = u[N].key) && (E[i] = u[N]);
              for (; v <= g; ) {
                  if (i = getKey(d = u[y]),
                  s = getKey(f[v] = maybeVNode(f[v], d)),
                  $[i] || null != s && s === getKey(u[y + 1])) {
                      null == i && r.removeChild(d.node),
                      y++;
                      continue
                  }
                  null == s || t.type === SSR_NODE ? (null == i && (patch(r, d && d.node, d, f[v], n, a),
                  v++),
                  y++) : (i === s ? (patch(r, d.node, d, f[v], n, a),
                  $[s] = !0,
                  y++) : null != (l = E[s]) ? (patch(r, r.insertBefore(l.node, d && d.node), l, f[v], n, a),
                  $[s] = !0) : patch(r, d && d.node, null, f[v], n, a),
                  v++)
              }
              for (; y <= m; )
                  null == getKey(d = u[y++]) && r.removeChild(d.node);
              for (var N in E)
                  null == $[N] && r.removeChild(E[N].node)
          }
      }
      return o.node = r
  }
    , propsChanged = (e,r)=>{
      for (var t in e)
          if (e[t] !== r[t])
              return !0;
      for (var t in r)
          if (e[t] !== r[t])
              return !0
  }
    , maybeVNode = (e,r)=>!0 !== e && !1 !== e && e ? "function" == typeof e.tag ? ((!r || null == r.memo || propsChanged(r.memo, e.memo)) && ((r = e.tag(e.memo)).memo = e.memo),
  r) : e : text("")
    , recycleNode = e=>e.nodeType === TEXT_NODE ? text(e.nodeValue, e) : createVNode(e.nodeName.toLowerCase(), EMPTY_OBJ, map.call(e.childNodes, recycleNode), SSR_NODE, e)
    , createVNode = (e,{key: r, ...t},o,n,a)=>({
      tag: e,
      props: t,
      key: r,
      children: o,
      type: n,
      node: a
  });
  var memo = (e,r)=>({
      tag: e,
      memo: r
  });
  var text = (e,r)=>createVNode(e, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, r);
  var h = (e,{class: r, ...t},o=EMPTY_ARR)=>createVNode(e, {
      ...t,
      ...r ? {
          class: createClass(r)
      } : EMPTY_OBJ
  }, isArray(o) ? o : [o]);
  var app = ({node: e, view: r, subscriptions: t, dispatch: o=id, init: n=EMPTY_OBJ})=>{
      var a, l, d = e && recycleNode(e), i = [], s = e=>{
          a !== e && (null == (a = e) && (o = t = p = id),
          t && (i = patchSubs(i, t(a), o)),
          r && !l && enqueue(p, l = !0))
      }
      , p = ()=>e = patch(e.parentNode, e, d, d = r(a), c, l = !1), c = function(e) {
          o(this.events[e.type], e)
      };
      return (o = o((e,r)=>"function" == typeof e ? o(e(a, r)) : isArray(e) ? "function" == typeof e[0] ? o(e[0], e[1]) : e.slice(1).map(e=>e && !0 !== e && (e[0] || e)(o, e[1]), s(e[0])) : s(e)))(n),
      o
  };

  return {
    memo,
    text,
    h,
    app,
  };
});
