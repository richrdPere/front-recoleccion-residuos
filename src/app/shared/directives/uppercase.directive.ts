import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appUppercase]'
})
export class UppercaseDirective {

  constructor(private ngControl: NgControl) { }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    if (!input || !input.value) return;

    const upper = input.value.toUpperCase();

    if (upper !== input.value) {
      this.ngControl.control?.setValue(upper, {
        emitEvent: false,
        emitModelToViewChange: true
      });
    }
  }
}
