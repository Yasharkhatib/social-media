// ERROR MIDDLEWARE | NEXT FUNCTION

const errorMiddleware = (err, req, res, next) => {
  const defaultError = {
    statusCode: 404,
    success: "failed",
    message: err,
  };

  if (err?.name === "validationError") {
    defaultError.statusCode = 404;

    defaultError.message = Object.values(err, errors)
      .map((e1) => e1.message)
      .join(",");
  }

  //duplicate error

  if (err.code && err.code === 11000) {
    defaultError.statusCode = 404;
    defaultError.message = `${Object.values(
      err.keyValue
    )} field has to be unique!`;
  }

  res.status(defaultError.statusCode).json({
    success: defaultError.success,
    message: defaultError.message,
  });
};

export default errorMiddleware;
