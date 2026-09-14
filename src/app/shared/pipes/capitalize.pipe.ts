import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalize',
})
export class CapitalizePipe implements PipeTransform {

  // transform(value: unknown, ...args: unknown[]): unknown {
  //   return value;
  // }

  transform(value: string): string {
    if (!value) return '';

    return value
      .toLowerCase()
      .split(' ')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }

}
