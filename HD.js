class HD {
  static PENDING = "pending";
  static FULFILLED = "fulfilled";
  static REJECTED = "rejected";

  constructor(executor) {
    this.status = HD.PENDING;
    this.value = null;
    this.callbacks = [];
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(value) {
    if (this.status === HD.PENDING) {
      this.value = value;
      this.status = HD.FULFILLED;
      setTimeout(() => {
        this.callbacks.map((callback) => {
          callback.onFulfilled(value);
        });
      });
    }
  }

  reject(value) {
    if (this.status === HD.PENDING) {
      this.value = value;
      this.status = HD.REJECTED;
      setTimeout(() => {
        this.callbacks.map((callback) => {
          callback.onRejected(value);
        });
      });
    }
  }
  then(onFulfilled, onRejected) {
    if (typeof onFulfilled !== "function") {
      onFulfilled = (value) => value;
    }
    if (typeof onRejected !== "function") {
      onRejected = (value) => value;
    }
    let promise = new HD((resolve, reject) => {
      // 闭包
      // 由于是链式调用，所以this指向的是前一个promise对象
      if (this.status === HD.PENDING) {
        this.callbacks.push({
          onFulfilled: (value) => {
            this.parse(promise, onFulfilled(value), resolve, reject);
          },
          onRejected: (value) => {
            this.parse(promise, onRejected(value), resolve, reject);
          },
        });
      }
      if (this.status === HD.FULFILLED) {
        setTimeout(() => {
          this.parse(promise, onFulfilled(this.value), resolve, reject);
        });
      }
      if (this.status === HD.REJECTED) {
        setTimeout(() => {
          this.parse(promise, onRejected(this.value), resolve, reject);
        });
      }
    });
    return promise;
  }
  parse(promise, result, resolve, reject) {
    if (promise === result) {
      throw new TypeError("Chaining cycle detected for promise");
    }
    try {
      if (result instanceof HD) {
        result.then(resolve, reject);
      } else {
        resolve(result);
      }
    } catch (error) {
      reject(error);
    }
  }
  static resolve(value) {
    return new HD((resolve, reject) => {
      if (value instanceof HD) {
        value.then(resolve, reject);
      } else {
        resolve(value);
      }
    });
  }
  static reject(value) {
    return new HD((resolve, reject) => {
      if (value instanceof HD) {
        value.then(resolve, reject);
      } else {
        reject(value);
      }
    });
  }
}
