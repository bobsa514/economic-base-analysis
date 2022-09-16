from dash import Dash, Input, Output, callback, dash_table, State, dcc, html
from eba import calc_lq

# using callback to input county_fips and naics_digits, and pass to eba
# return a table of data
# https://dash.plotly.com/interactive-graphing
# https://dash.plotly.com/layout
# https://dash.plotly.com/dash-core-components
# https://dash.plotly.com/dash-html-components

app = Dash(__name__)
app.layout = html.Div([
    html.Div([
        html.H1("Local Quotient"),
        html.Div("County FIPS:"),
        dcc.Input(id='input-county-fips', value='06073', type='text'),
        html.Div("NAICS Digits:"),
        dcc.Input(id='input-naics-digits', value='4', type='text'),
        html.Button('Submit', id='button'),
        html.Div(id='output-container-button',
                 children='Enter a value and press submit'),
    ]),
    html.Div([
        html.Div(id='output-container-table'),
    ], style={'columnCount': 2}),
])

@app.callback(
    Output(component_id='output-container-button', component_property='children'),
    Output(component_id='output-container-table', component_property='children'),
    Input(component_id='button', component_property='n_clicks'),
    State(component_id='input-county-fips', component_property='value'),
    State(component_id='input-naics-digits', component_property='value'),
)

def update_output(n_clicks, input_county_fips, input_naics_digits):
    if n_clicks is None:
        return 'Enter a value and press submit', ''
    else:
        df = calc_lq(input_county_fips, input_naics_digits)
        return 'The county FIPS input value was "{}" and the NAICS code digit input value was "{}"'.format(input_county_fips, input_naics_digits), dash_table.DataTable(
            id='table',
            columns=[{"name": i, "id": i} for i in df.columns],
            data=df.to_dict('records'),
            style_table={'height': '400px', 'width': '1200px', 'overflowY': 'auto'},
            page_size=10,
            style_data={
                'width': '100px',
                'maxWidth': '100px',
                'minWidth': '100px',
             },
            style_cell_conditional=[
                {
                    'if': {'column_id': 'description'},
                    'width': '800px'
                },
            ],
        )

if __name__ == '__main__':
    app.run_server(debug=True)