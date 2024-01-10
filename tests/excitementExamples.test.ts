import { test, expect, describe, spyOn } from "bun:test";
import excitementExamples from "../utilities/excitementExample.ts";

describe("excitementExamples Functionality", () => {
  test("Returns an array of length 3", () => {
    const examples = excitementExamples();
    expect(examples).toHaveLength(3);
  });

  test("Each element of the array is a string", () => {
    const examples = excitementExamples();
    examples.forEach((example) => {
      expect(typeof example).toBe("string");
    });
  });

  /* It is not a problem if same element appears twice in the same set
   but can't have receive the same array at all times;
  ! will be ocassionally false */
  test("Array elements must be mostly different", () => {
    const examples1 = excitementExamples();
    const examples2 = excitementExamples();
    let arraysAreDifferent = false;
    for (let i = 0; i < examples1.length; i++) {
      if (examples1[i] !== examples2[i]) {
        arraysAreDifferent = true;
        break;
      }
    }
    expect(arraysAreDifferent).toBeTruthy();
  });

  test("Should work when Math.random() returns 0", () => {
    spyOn(Math, "random").mockReturnValue(0);

    const examples = excitementExamples();

    // Expecting all elements to be the same as 0 picks the first one - always
    const equality = examples[0] === examples[1] && examples[1] === examples[2];
    expect(equality).toBeTruthy();

    // Restore Math.random to its original implementation
    spyOn(Math, "random").mockRestore();
  });
});
