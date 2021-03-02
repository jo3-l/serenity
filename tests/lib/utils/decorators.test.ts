import { autobind } from '#utils/decorators';

describe('@autobind', () => {
	it('should bind the method to the class instance', () => {
		class Person {
			public constructor(public readonly name: string, public readonly age: number) {}

			@autobind
			public canDrinkAlcohol() {
				return this.age >= 18;
			}
		}

		const andrew = new Person('Andrew', 2);
		const andrewCanDrinkAlcohol = andrew.canDrinkAlcohol;

		expect(andrewCanDrinkAlcohol()).toBe(false);
	});

	it('should throw an error if the target was not a function', () => {
		expect(() => {
			class Product {
				// @ts-expect-error
				@autobind
				public readonly name: string;

				public readonly price: number;
				public constructor(name: string, price: number) {
					this.name = name;
					this.price = price;
				}

				public toString() {
					return `${this.name} (costs $${this.price})`;
				}
			}

			const wine = new Product('wine', 3);
			wine.toString();
		}).toThrow();
	});
});
