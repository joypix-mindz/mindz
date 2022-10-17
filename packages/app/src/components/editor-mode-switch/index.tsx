import React, { useState, useEffect, cloneElement } from 'react';
import {
  StyledAnimateRadioContainer,
  StyledRadioMiddle,
  StyledMiddleLine,
  StyledRadioItem,
  StyledLabel,
  StyledIcon,
} from './style';
import type {
  RadioItemStatus,
  AnimateRadioProps,
  AnimateRadioItemProps,
} from './type';
import { useTheme } from '@/styles';
import { EdgelessIcon, PaperIcon } from './icons';
import { useEditor } from '@/components/editor-provider';

const PaperItem = ({ active }: { active?: boolean }) => {
  const {
    theme: {
      colors: { highlight, disabled },
    },
  } = useTheme();

  return <PaperIcon style={{ color: active ? highlight : disabled }} />;
};

const EdgelessItem = ({ active }: { active?: boolean }) => {
  const {
    theme: {
      colors: { highlight, disabled },
    },
  } = useTheme();

  return <EdgelessIcon style={{ color: active ? highlight : disabled }} />;
};

const AnimateRadioItem = ({
  active,
  status,
  icon,
  label,
  isLeft,
  ...props
}: AnimateRadioItemProps) => {
  return (
    <StyledRadioItem active={active} status={status} {...props}>
      <StyledIcon shrink={status === 'shrink'} isLeft={isLeft}>
        {cloneElement(icon, {
          active,
        })}
      </StyledIcon>

      <StyledLabel shrink={status !== 'stretch'}>{label}</StyledLabel>
    </StyledRadioItem>
  );
};

const RadioMiddle = ({
  isHover,
  direction,
}: {
  isHover: boolean;
  direction: 'left' | 'right' | 'middle';
}) => {
  return (
    <StyledRadioMiddle hidden={!isHover}>
      <StyledMiddleLine hidden={false} />
    </StyledRadioMiddle>
  );
};

export const EditorModeSwitch = ({
  isHover,
  style = {},
}: AnimateRadioProps) => {
  const { mode, setMode } = useEditor();
  const modifyRadioItemStatus = (): RadioItemStatus => {
    return {
      left: isHover
        ? mode === 'page'
          ? 'stretch'
          : 'normal'
        : mode === 'page'
        ? 'shrink'
        : 'hidden',
      right: isHover
        ? mode === 'edgeless'
          ? 'stretch'
          : 'normal'
        : mode === 'edgeless'
        ? 'shrink'
        : 'hidden',
    };
  };
  const [radioItemStatus, setRadioItemStatus] = useState<RadioItemStatus>(
    modifyRadioItemStatus
  );

  useEffect(() => {
    setRadioItemStatus(modifyRadioItemStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHover, mode]);

  return (
    <StyledAnimateRadioContainer shrink={!isHover} style={style}>
      <AnimateRadioItem
        isLeft={true}
        label="Paper"
        icon={<PaperItem />}
        active={mode === 'page'}
        status={radioItemStatus.left}
        onClick={() => {
          setMode('page');
        }}
        onMouseEnter={() => {
          setRadioItemStatus({
            right: 'normal',
            left: 'stretch',
          });
        }}
        onMouseLeave={() => {
          setRadioItemStatus(modifyRadioItemStatus());
        }}
      />
      <StyledMiddleLine hidden={!isHover} />
      <AnimateRadioItem
        isLeft={false}
        label="Edgeless"
        icon={<EdgelessItem />}
        active={mode === 'edgeless'}
        status={radioItemStatus.right}
        onClick={() => {
          setMode('edgeless');
        }}
        onMouseEnter={() => {
          setRadioItemStatus({
            left: 'normal',
            right: 'stretch',
          });
        }}
        onMouseLeave={() => {
          setRadioItemStatus(modifyRadioItemStatus());
        }}
      />
    </StyledAnimateRadioContainer>
  );
};

export default EditorModeSwitch;
