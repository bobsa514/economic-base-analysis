from dash import html, dcc
import dash_bootstrap_components as dbc
from ..models.database import get_session, County

def create_county_dropdown():
    session = get_session()
    counties = session.query(County).order_by(County.full_name).all()
    session.close()
    
    options = [{'label': county.full_name, 'value': county.fips} for county in counties]
    
    return dbc.Card([
        dbc.CardBody([
            html.H4("Select County", className="card-title"),
            dcc.Dropdown(
                id='county-dropdown',
                options=options,
                placeholder="Select a county...",
                className="mb-3"
            ),
            dbc.FormText("Choose a county to analyze its economic base")
        ])
    ], className="mb-4")

def create_naics_controls():
    return dbc.Card([
        dbc.CardBody([
            html.H4("NAICS Detail Level", className="card-title"),
            dbc.RadioItems(
                id='naics-digits',
                options=[
                    {'label': '2-digit (Sector)', 'value': '2'},
                    {'label': '3-digit (Subsector)', 'value': '3'},
                    {'label': '4-digit (Industry Group)', 'value': '4'},
                    {'label': '5-digit (Industry)', 'value': '5'},
                    {'label': '6-digit (National Industry)', 'value': '6'},
                ],
                value='4',
                inline=True,
                className="mb-3"
            ),
            dbc.FormText("Higher numbers provide more detailed industry classification")
        ])
    ], className="mb-4")

def create_results_controls():
    return dbc.Card([
        dbc.CardBody([
            html.H4("Results Settings", className="card-title"),
            dbc.InputGroup([
                dbc.InputGroupText("Show top"),
                dbc.Input(
                    id='num-items',
                    type='number',
                    min=1,
                    max=100,
                    value=10,
                    style={'width': '100px'}
                ),
                dbc.InputGroupText("industries")
            ], className="mb-3"),
            dbc.Button(
                "Analyze",
                id='analyze-button',
                color="primary",
                className="w-100"
            )
        ])
    ], className="mb-4")

def create_inputs_section():
    return dbc.Col([
        create_county_dropdown(),
        create_naics_controls(),
        create_results_controls()
    ], md=4) 