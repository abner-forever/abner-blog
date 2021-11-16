class A {
    name: string
    page: string
    val: Number
    constructor() {
        this.name = 'a';
        this.page = 'a';
        this.val = 1
    }
}

class B {
    name: string
    // page: string
    // val:Number
    constructor() {
        this.name = 'B'
        // this.page = 'B';
        // this.val =2
    }
}

export default A as B