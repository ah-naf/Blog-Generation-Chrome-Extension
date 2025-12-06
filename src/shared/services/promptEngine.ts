import { PromptTemplate } from '../types/promptTypes';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class PromptEngine {
  private variablePattern = /\{\{([^}]+)\}\}/g;

  inject(template: PromptTemplate, data: Record<string, unknown>): string {
    let result = template.templateText;

    result = result.replace(this.variablePattern, (match, varPath) => {
      const value = this.getNestedValue(data, varPath.trim());
      if (value === undefined) {
        const defaultVar = template.variables.find(
          (v) => v.name === varPath.trim()
        );
        return defaultVar?.default ?? match;
      }

      if (Array.isArray(value)) {
        return value.join('\n');
      }
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    });

    return result;
  }

  validate(template: PromptTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template.templateText?.trim()) {
      errors.push('Template text is empty');
    }

    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    const usedVars = this.extractVariables(template.templateText);
    const definedVars = template.variables.map((v) => v.name);

    for (const v of usedVars) {
      if (!definedVars.includes(v)) {
        warnings.push(`Variable '${v}' is used but not defined`);
      }
    }

    for (const v of template.variables) {
      if (v.required && !usedVars.includes(v.name)) {
        warnings.push(`Required variable '${v.name}' is defined but not used`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  extractVariables(templateText: string): string[] {
    const variables: string[] = [];
    let match;

    while ((match = this.variablePattern.exec(templateText)) !== null) {
      const varName = match[1].trim().split('.')[0];
      if (!variables.includes(varName)) {
        variables.push(varName);
      }
    }

    this.variablePattern.lastIndex = 0;
    return variables;
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }
}

export const promptEngine = new PromptEngine();
