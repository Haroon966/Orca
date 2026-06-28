import type { TaskMasterTask } from '../types';

export function buildTaskImplementPrompt(task: TaskMasterTask): string {
  const lines = [
    `Implement Task ${task.id}: ${task.title}`,
  ];

  if (task.description?.trim()) {
    lines.push('', 'Description:', task.description.trim());
  }

  if (task.details?.trim()) {
    lines.push('', 'Details:', task.details.trim());
  }

  if (task.testStrategy?.trim()) {
    lines.push('', 'Test strategy:', task.testStrategy.trim());
  }

  if (Array.isArray(task.dependencies) && task.dependencies.length > 0) {
    lines.push('', `Dependencies: ${task.dependencies.join(', ')}`);
  }

  lines.push('', 'Please implement this task in the current project.');
  return lines.join('\n');
}
