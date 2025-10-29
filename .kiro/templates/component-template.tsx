/**
 * @file {{COMPONENT_NAME}}.tsx
 * @description {{DESCRIPTION}}
 * @created {{DATE}}
 * @author {{AUTHOR}}
 */

import { type FC, type ReactNode } from 'react';

/**
 * Props for {{COMPONENT_NAME}} component
 */
export interface {{COMPONENT_NAME}}Props {
  /**
   * Children elements to render inside the component
   */
  children?: ReactNode;
  
  /**
   * Custom CSS class name
   */
  className?: string;
  
  // Add more props here
}

/**
 * {{COMPONENT_NAME}} Component
 * 
 * @example
 * ```tsx
 * <{{COMPONENT_NAME}}>
 *   <p>Content</p>
 * </{{COMPONENT_NAME}}>
 * ```
 */
export const {{COMPONENT_NAME}}: FC<{{COMPONENT_NAME}}Props> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`{{kebab-case-name}} ${className}`.trim()}>
      {children}
    </div>
  );
};

{{COMPONENT_NAME}}.displayName = '{{COMPONENT_NAME}}';

