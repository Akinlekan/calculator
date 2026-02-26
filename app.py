from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    expression = data.get('expression', '')

    if not expression:
        return jsonify({'result': 'Error', 'error': 'Empty expression'})

    try:
        # Replace display characters with Python operators
        expression = expression.replace('×', '*').replace('÷', '/').replace('^', '**')

        # Security: only allow safe characters
        allowed_chars = set('0123456789+-*/().** ')
        if not all(c in allowed_chars for c in expression):
            return jsonify({'result': 'Error', 'error': 'Invalid characters'})

        result = eval(expression, {"__builtins__": {}})

        # Handle division by zero and similar
        if isinstance(result, float):
            if result != result:  # NaN check
                return jsonify({'result': 'Error', 'error': 'Not a number'})
            # Round to avoid floating point artifacts
            result = round(result, 10)
            # Remove trailing zeros
            if result == int(result):
                result = int(result)

        return jsonify({'result': str(result)})

    except ZeroDivisionError:
        return jsonify({'result': 'Error', 'error': 'Division by zero'})
    except Exception as e:
        return jsonify({'result': 'Error', 'error': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
