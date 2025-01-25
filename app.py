from flask import Flask, render_template, request, jsonify
import csv

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('booking.html')

@app.route('/save_ticket', methods=['POST'])
def save_ticket():
    ticket_data = request.get_json()
    print(f"Received ticket data: {ticket_data}")  # Log received data for debugging
    
    # Define the CSV file where the ticket data will be saved
    file_name = 'tickets.csv'
    
    # Define the fieldnames (columns) for the CSV
    fieldnames = ['ticketNumber', 'name', 'email', 'phone', 'museum', 'visitDate', 'indianTickets', 'foreignerTickets', 'totalPrice', 'paymentId']
    
    try:
        with open(file_name, mode='a', newline='') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            
            # Write the header only if the file is empty
            if file.tell() == 0:
                writer.writeheader()
            
            # Write the ticket data
            writer.writerow(ticket_data)
        print("Ticket data saved successfully!")  # Log success message
        return jsonify({'message': 'Ticket data saved successfully!'}), 200
    except Exception as e:
        print(f"Error saving ticket data: {str(e)}")  # Log any error
        return jsonify({'message': f'Error saving ticket data: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
