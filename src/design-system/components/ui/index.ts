// components/ui/index.ts
export { Button }  from './Button';
export { Badge }   from './Badge';
export { Chip }    from './Chip';
export { Tag }     from './Tag';
export { Text }    from './Text';
export { Card }    from './Card';
export { Divider } from './Divider';
export { Avatar }  from './Avatar';
export { Alert }   from './Alert';

export type { ButtonProps, ButtonVariant, ButtonSize }    from './Button';
export type { BadgeProps, BadgeVariant, BadgeSize }       from './Badge';
export type { ChipProps }                                 from './Chip';
export type { TagProps, TagVariant }                      from './Tag';
export type { TextProps, TextVariant, TextColor }         from './Text';
export type { CardProps, CardVariant, CardPadding }       from './Card';
export type { DividerProps }                              from './Divider';
export type { AvatarProps, AvatarSize }                   from './Avatar';
export type { AlertProps, AlertVariant }                  from './Alert';

export { TextInput } from './TextInput';
export { TextArea }  from './TextArea';
export type { TextInputProps, TextInputSize } from './TextInput';
export type { TextAreaProps } from './TextArea';

export { SocialButton } from './SocialButton';
export { IconButton }   from './IconButton';
export { LinkButton }   from './LinkButton';
export type { SocialButtonProps, SocialProvider, SocialButtonSize } from './SocialButton';
export type { IconButtonProps, IconButtonVariant, IconButtonSize }   from './IconButton';
export type { LinkButtonProps, LinkButtonType }                       from './LinkButton';

export { Switch } from './Switch';
export type { SwitchProps, SwitchSize } from './Switch';

export { ProgressBar }    from './ProgressBar';
export { ProgressCircle } from './ProgressCircle';
export type { ProgressBarProps, ProgressBarColor, ProgressBarLayout }          from './ProgressBar';
export type { ProgressCircleProps, ProgressCircleLayout }                       from './ProgressCircle';

export { BottomDock } from './BottomDock';
export type { BottomDockProps, BottomDockAction, BottomDockBadge } from './BottomDock';

export { Checkbox } from './Checkbox';
export type { CheckboxProps, CheckboxSize } from './Checkbox';

export { Tabs } from './Tabs';
export type { TabsProps, TabItem } from './Tabs';

export { Rating } from './Rating';
export type { RatingProps, RatingSize } from './Rating';

export { Radio, RadioGroup, RadioGroupItem } from './Radio';
export type { RadioProps, RadioGroupProps, RadioGroupItemProps, RadioSize } from './Radio';

export { SpinnerRound, SpinnerDots } from './Spinner';
export type { SpinnerRoundProps, SpinnerDotsProps, SpinnerSize } from './Spinner';

export { Select } from './Select';
export type { SelectProps, SelectOption, SelectSize } from './Select';

export { Accordion, AccordionGroup } from './Accordion';
export type { AccordionProps, AccordionGroupProps, AccordionItem, AccordionVariant } from './Accordion';

export { Modal } from './Modal';
export type { ModalProps, ModalAction, ModalType } from './Modal';

export { AspectRatio } from './AspectRatio';
export type { AspectRatioProps, AspectRatioProportion } from './AspectRatio';

export { Pagination } from './Pagination';
export type { PaginationProps, PaginationVariant } from './Pagination';

export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem, BreadcrumbsSeparator } from './Breadcrumbs';

export { SegmentedControl } from './SegmentedControl';
export type { SegmentedControlProps, SegmentedItem } from './SegmentedControl';

// ── Phase 6 molecules ─────────────────────────────────────────────────────────
export { InvitationCard }     from './InvitationCard';
export { NotificationToggle } from './NotificationToggle';
export { SuccessCheckmark }   from './SuccessCheckmark';
export type { InvitationCardProps, InvitationStatus, InvitationRole } from './InvitationCard';
export type { NotificationToggleProps }                                from './NotificationToggle';
export type { SuccessCheckmarkProps }                                  from './SuccessCheckmark';

// ── Phase 7 molecules ─────────────────────────────────────────────────────────
export { OfflineAlert } from './OfflineAlert';

// ── Phase 8 molecules ─────────────────────────────────────────────────────────
export { EmptyState }                                                from './EmptyState';
export { Skeleton, SkeletonText, SkeletonAvatar,
         SkeletonTimelineItem, SkeletonTimeline,
         SkeletonChart, SkeletonCard }                               from './Skeleton';
export type { EmptyStateProps, EmptyStateCta }                       from './EmptyState';
export type { SkeletonProps }                                        from './Skeleton';
