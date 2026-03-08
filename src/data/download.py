import pandas as pd
from sqlalchemy.exc import SQLAlchemyError
from ..models.database import County, NAICSData, get_session

def download_fips_data():
    """Download and process FIPS data"""
    fips_url = 'https://raw.githubusercontent.com/kjhealy/fips-codes/master/county_fips_master.csv'
    df = pd.read_csv(fips_url, encoding='ISO-8859-1')
    df['fips'] = df['fips'].apply(lambda x: str(x).zfill(5))
    df = df[['fips', 'county_name', 'state_name']]
    df['full_name'] = df['county_name'] + ', ' + df['state_name']
    return df

def download_cbp_data():
    """Download and process CBP data"""
    cbp20url = 'https://www2.census.gov/programs-surveys/cbp/datasets/2020/cbp20co.zip'
    df = pd.read_csv(cbp20url)
    
    # Process county data
    df['fipstate'] = df['fipstate'].apply(lambda x: str(x).zfill(2))
    df['fipscty'] = df['fipscty'].apply(lambda x: str(x).zfill(3))
    df['fips'] = df['fipstate'] + df['fipscty']
    df = df[['fips', 'naics', 'emp']]
    df = df.rename(columns={'emp': 'emp_co'})
    
    # Process NAICS codes
    df['naics'] = df['naics'].str.replace('-', '').str.replace('/', '')
    df['digit'] = df['naics'].str.len()
    df.loc[df['digit'] == 0, 'naics'] = '0'
    
    # Download US data
    cbp20us_url = 'https://www2.census.gov/programs-surveys/cbp/datasets/2020/cbp20us.zip'
    df_us = pd.read_csv(cbp20us_url)
    df_us = df_us.rename(columns={'emp': 'emp_us'})
    df_us = df_us[df_us['lfo'] == '-']
    df_us = df_us[['naics', 'emp_us']]
    
    # Download NAICS descriptions
    naics_desc_url = 'https://www2.census.gov/programs-surveys/cbp/technical-documentation/reference/naics-descriptions/naics2017.txt'
    naics_desc = pd.read_csv(naics_desc_url, sep=",", encoding='cp1252')
    naics_desc.columns = ['naics', 'description']
    
    # Process US data
    df_us = df_us.merge(naics_desc, on='naics')
    df_us['naics'] = df_us['naics'].str.replace('-', '').str.replace('/', '')
    df_us['digit'] = df_us['naics'].str.len()
    df_us.loc[df_us['digit'] == 0, 'naics'] = '0'
    
    return df, df_us

def update_database():
    """Update the database with latest data"""
    session = get_session()
    try:
        # Download and process data
        fips_df = download_fips_data()
        county_df, us_df = download_cbp_data()
        
        # Update counties table
        for _, row in fips_df.iterrows():
            county = County(
                fips=row['fips'],
                county_name=row['county_name'],
                state_name=row['state_name'],
                full_name=row['full_name']
            )
            session.merge(county)
        
        # Update NAICS data
        for _, row in county_df.iterrows():
            naics_data = NAICSData(
                fips=row['fips'],
                naics=row['naics'],
                digit=row['digit'],
                emp_co=row['emp_co']
            )
            session.merge(naics_data)
        
        # Update US data
        for _, row in us_df.iterrows():
            naics_data = NAICSData(
                naics=row['naics'],
                digit=row['digit'],
                emp_us=row['emp_us'],
                description=row['description']
            )
            session.merge(naics_data)
        
        session.commit()
    except SQLAlchemyError as e:
        session.rollback()
        raise e
    finally:
        session.close() 