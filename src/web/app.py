from dash import Dash, Input, Output, callback, html, dcc
import dash_bootstrap_components as dbc
import pandas as pd
from sqlalchemy import func
from ..models.database import get_session, NAICSData
from .components.header import create_header
from .components.inputs import create_inputs_section
from .components.results import create_results_section, create_results_content

app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

app.layout = dbc.Container([
    create_header(),
    dbc.Row([
        create_inputs_section(),
        create_results_section()
    ])
], fluid=True)

@app.callback(
    Output('results-container', 'children'),
    Input('analyze-button', 'n_clicks'),
    Input('county-dropdown', 'value'),
    Input('naics-digits', 'value'),
    Input('num-items', 'value'),
    prevent_initial_call=True
)
def update_results(n_clicks, county_fips, naics_digits, num_items):
    if not all([county_fips, naics_digits, num_items]):
        return "Please select a county and adjust settings"
    
    session = get_session()
    try:
        # Calculate location quotients
        naics_digits = int(naics_digits)
        
        # Get county and US totals
        county_total = session.query(
            func.sum(NAICSData.emp_co)
        ).filter(
            NAICSData.fips == county_fips,
            NAICSData.digit == 0
        ).scalar()
        
        us_total = session.query(
            func.sum(NAICSData.emp_us)
        ).filter(
            NAICSData.digit == 0
        ).scalar()
        
        # Get industry data
        query = session.query(
            NAICSData.naics,
            NAICSData.description,
            NAICSData.emp_co,
            NAICSData.emp_us
        ).filter(
            NAICSData.fips == county_fips,
            NAICSData.digit == naics_digits
        )
        
        df = pd.read_sql(query.statement, session.bind)
        
        # Calculate location quotients
        df['location_quotient'] = (df['emp_co'] / county_total) / (df['emp_us'] / us_total)
        
        # Sort and filter
        df = df[df['location_quotient'] > 1].sort_values('location_quotient', ascending=False).head(num_items)
        
        return create_results_content(df)
        
    except Exception as e:
        return f"Error: {str(e)}"
    finally:
        session.close()

if __name__ == '__main__':
    app.run_server(debug=True) 