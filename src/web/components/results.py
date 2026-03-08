from dash import html, dcc
import dash_bootstrap_components as dbc
import plotly.express as px

def create_results_section():
    return dbc.Col([
        dbc.Card([
            dbc.CardBody([
                html.H4("Analysis Results", className="card-title"),
                dbc.Spinner(
                    html.Div(id='results-container'),
                    color="primary"
                )
            ])
        ])
    ], md=8)

def create_results_content(df):
    if df is None or df.empty:
        return html.Div("Select a county and click 'Analyze' to see results")
    
    # Create bar chart
    fig = px.bar(
        df,
        x='location_quotient',
        y='description',
        orientation='h',
        title='Top Industries by Location Quotient',
        labels={'location_quotient': 'Location Quotient', 'description': 'Industry'},
        height=400
    )
    fig.update_layout(
        yaxis={'categoryorder': 'total ascending'},
        margin=dict(l=20, r=20, t=40, b=20)
    )
    
    # Create table
    table = dbc.Table.from_dataframe(
        df,
        striped=True,
        bordered=True,
        hover=True,
        responsive=True,
        className="mt-4"
    )
    
    return html.Div([
        dcc.Graph(figure=fig),
        table
    ]) 