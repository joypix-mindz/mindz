import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { Menu, MenuItem } from '../../../ui/menu';
import { literalMatcher } from './literal-matcher';
import type { TFunction, TType } from './logical/typesystem';
import type { Filter, Literal } from './vars';
import { ChangeFilterMenu, filterMatcher, vars } from './vars';

export const Condition = ({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (filter: Filter) => void;
}) => {
  const data = useMemo(
    () => filterMatcher.find(v => v.data.name === value.funcName),
    [value.funcName]
  );
  if (!data) {
    return null;
  }
  const render =
    data.data.render ??
    (({ ast }) => {
      const args = renderArgs(value, onChange, data.type);
      return (
        <div
          style={{ display: 'flex', userSelect: 'none', alignItems: 'center' }}
        >
          <Menu
            trigger="click"
            content={<ChangeFilterMenu selected={[]} onSelect={onChange} />}
          >
            <div>{ast.left.name}</div>
          </Menu>
          <Menu
            trigger="click"
            content={<FunctionSelect value={value} onChange={onChange} />}
          >
            <div style={{ marginLeft: 4, color: 'gray' }}>{ast.funcName}</div>
          </Menu>
          {args}
        </div>
      );
    });
  return <>{render({ ast: value })}</>;
};

const FunctionSelect = ({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (value: Filter) => void;
}) => {
  const list = useMemo(() => {
    const type = vars.find(v => v.name === value.left.name)?.type;
    if (!type) {
      return [];
    }
    return filterMatcher.allMatchedData(type);
  }, [value.left.name]);
  return (
    <div>
      {list.map(v => (
        <MenuItem
          onClick={() => {
            onChange({
              ...value,
              funcName: v.name,
              args: v.defaultArgs().map(v => ({ type: 'literal', value: v })),
            });
          }}
          key={v.name}
        >
          {v.name}
        </MenuItem>
      ))}
    </div>
  );
};

export const Arg = ({
  type,
  value,
  onChange,
}: {
  type: TType;
  value: Literal;
  onChange: (lit: Literal) => void;
}) => {
  const data = useMemo(() => literalMatcher.match(type), [type]);
  if (!data) {
    return null;
  }
  return (
    <div style={{ marginLeft: 4 }}>
      {data.render({ type, value, onChange })}
    </div>
  );
};
export const renderArgs = (
  filter: Filter,
  onChange: (value: Filter) => void,
  type: TFunction
): ReactNode => {
  const rest = type.args.slice(1);
  return rest.map((type, i) => {
    const value = filter.args[i];
    return (
      <Arg
        key={i}
        type={type}
        value={value}
        onChange={value => {
          const args = filter.args.map((v, index) => (i === index ? value : v));
          onChange({
            ...filter,
            args,
          });
        }}
      ></Arg>
    );
  });
};
