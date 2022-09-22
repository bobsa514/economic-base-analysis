from dash import Dash, Input, Output, callback, dash_table, State, dcc, html
import dash_bootstrap_components as dbc
from eba import calc_lq

app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

app.layout = html.Div([
    html.Div([
        html.H1("Local Quotient"),

        html.Br(),

        dbc.Label("County FIPS:"),
        dbc.Input(id='input-county-fips',placeholder="Example: 06073", type="text"),
        dbc.FormText("FIPS code should be 5 digits"),

        html.Br(),
        html.Br(),

        dbc.Label("NAICS Digits:"),
        # create radio optinos
        dbc.RadioItems(
            id='input-naics-digits',
            options=[
                {'label': '2-digit', 'value': '2'},
                {'label': '3-digit', 'value': '3'},
                {'label': '4-digit', 'value': '4'},
                {'label': '5-digit', 'value': '5'},
                {'label': '6-digit', 'value': '6'},
            ],
            inline=True
        ),
        dbc.FormText("Enter value 2 to 6. NAICS digits stand for the detail level of NAICS code. The higher the number is, the more detailed the NAICS code is. "),

        html.Br(),
        html.Br(),

        dbc.Label("Number of items to return:"),
        dbc.Input(id='input-num-items',placeholder="Example: 10", type="number"),
        dbc.FormText("Enter a number between 1 and 100"),

        html.Br(),
        html.Br(),

        dbc.Button('Submit', color="primary", className="me-1", id='button'),
        html.Div(id='output-container-button',
                 children='Enter the values above and press submit'),
    ]),

    html.Br(),
    html.Br(),

    html.Div([
        html.Div(id='output-container-table'),
    ], style={'columnCount': 1}),
])

@app.callback(
    Output(component_id='output-container-button', component_property='children'),
    Output(component_id='output-container-table', component_property='children'),
    Input(component_id='button', component_property='n_clicks'),
    State(component_id='input-county-fips', component_property='value'),
    State(component_id='input-naics-digits', component_property='value'),
    State(component_id='input-num-items', component_property='value'),
)

def update_output(n_clicks, input_county_fips, input_naics_digits, input_num_items):
    if n_clicks is None:
        return 'Enter a value and press submit', ''
    else:
        df = calc_lq(input_county_fips, input_naics_digits, input_num_items)
        # return table with bootstrap style
        return 'The result is shown below', dash_table.DataTable(
            data=df.to_dict('records'),
            columns=[{'name': i, 'id': i} for i in df.columns],
            style_cell={'textAlign': 'left'},
            style_header={
                'backgroundColor': 'rgb(230, 230, 230)',
                'fontWeight': 'bold'
            },
            style_table={
                'maxHeight': '800px',
                'overflowY': 'scroll'
            }
        )


if __name__ == '__main__':
    app.run_server(debug=True)