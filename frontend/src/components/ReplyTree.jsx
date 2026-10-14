import { useState } from "react";
import ReplyItem from "./ReplyItem";

const MAX_INDENT_DEPTH = 4;

export function groupByParent(replies) {
  const children = {};
  for (const reply of replies) {
    let key = "root";
    if (reply.parent_id) {
      key = reply.parent_id;
    }
    if (!children[key]) {
      children[key] = [];
    }
    children[key].push(reply);
  }
  return children;
}

export function countDescendants(children, replyId) {
  let total = 0;
  const direct = children[replyId] || [];
  for (const child of direct) {
    total += 1 + countDescendants(children, child.id);
  }
  return total;
}

export default function ReplyTree({ replies, onAdded, onChange, onDelete }) {
  const children = groupByParent(replies);
  const roots = children.root || [];

  return (
    <ul>
      {roots.map((reply) => (
        <li key={reply.id} className="border-t border-slate-100 px-4 py-4 sm:px-5">
          <ReplyNode
            reply={reply}
            depth={0}
            childrenMap={children}
            onAdded={onAdded}
            onChange={onChange}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

function ReplyNode({ reply, depth, childrenMap, onAdded, onChange, onDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const kids = childrenMap[reply.id] || [];
  const hidden = countDescendants(childrenMap, reply.id);

  let itemClass = "rounded-xl";
  if (reply.just_posted) {
    itemClass = "animate-flash rounded-xl";
  }

  function handleAdded(newReply) {
    setCollapsed(false);
    onAdded(newReply);
  }

  const tooDeep = depth + 1 >= MAX_INDENT_DEPTH;

  let toggleLabel = `Hide ${hidden} replies`;
  let showLabel = `Show ${hidden} replies`;
  if (hidden === 1) {
    toggleLabel = "Hide 1 reply";
    showLabel = "Show 1 reply";
  }

  return (
    <div>
      <div className={itemClass}>
        <ReplyItem
          reply={reply}
          descendantCount={hidden}
          onAdded={handleAdded}
          onChange={onChange}
          onDelete={onDelete}
        />
      </div>

      {kids.length > 0 && tooDeep && (
        <ul className="mt-4 space-y-4">
          {kids.map((child) => (
            <li key={child.id}>
              <ReplyNode
                reply={child}
                depth={depth + 1}
                childrenMap={childrenMap}
                onAdded={onAdded}
                onChange={onChange}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}

      {kids.length > 0 && !tooDeep && collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-expanded="false"
          className="ml-10 mt-2 rounded-full bg-zpink/10 px-3 py-1 text-xs font-bold text-zpink transition hover:bg-zpink/20"
        >
          {showLabel}
        </button>
      )}

      {kids.length > 0 && !tooDeep && !collapsed && (
        <div className="ml-[17px] mt-3 flex">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-expanded="true"
            aria-label={toggleLabel}
            title={toggleLabel}
            className="group -ml-[9px] mr-[7px] flex w-5 shrink-0 justify-center"
          >
            <span className="w-0.5 rounded-full bg-mist transition group-hover:w-1 group-hover:bg-zpink" />
          </button>
          <ul className="min-w-0 flex-1 space-y-4">
            {kids.map((child) => (
              <li key={child.id}>
                <ReplyNode
                  reply={child}
                  depth={depth + 1}
                  childrenMap={childrenMap}
                  onAdded={onAdded}
                  onChange={onChange}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
